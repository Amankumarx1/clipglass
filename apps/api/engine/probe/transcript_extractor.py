import re
import json
import urllib.request
from typing import Dict, Any, List, Optional, Tuple
from schemas.clip import TranscriptSentence, TranscriptWord

NOISE_TAG_REGEX = re.compile(r'\[(Music|Applause|Laughter|Cheering|Audio|Silence)\]|\((Music|Applause|Laughter|Cheering)\)', re.IGNORECASE)

def parse_json3_subtitles(raw_json: Dict[str, Any]) -> Tuple[List[TranscriptSentence], List[TranscriptWord], List[Dict[str, Any]]]:
    """
    Parses YouTube json3 format subtitles which provide clean word-level offsets
    without rolling duplicate cues.
    """
    sentences: List[TranscriptSentence] = []
    all_words: List[TranscriptWord] = []
    noise_events: List[Dict[str, Any]] = []

    events = raw_json.get("events", [])
    for ev in events:
        t_start_ms = ev.get("tStartMs", 0)
        d_dur_ms = ev.get("dDurationMs", 0)
        t_end_ms = t_start_ms + d_dur_ms

        segs = ev.get("segs", [])
        if not segs:
            continue

        sentence_words: List[TranscriptWord] = []
        raw_text_parts: List[str] = []

        curr_word_start = t_start_ms / 1000.0

        for seg in segs:
            utf8 = seg.get("utf8", "")
            if not utf8:
                continue

            # Check for noise markers
            noise_match = NOISE_TAG_REGEX.search(utf8)
            if noise_match:
                tag = noise_match.group(0).strip("[]()")
                noise_events.append({
                    "time": round(curr_word_start, 3),
                    "tag": tag.lower()
                })
                # If segment is solely a noise tag, skip adding as speech word
                if NOISE_TAG_REGEX.fullmatch(utf8.strip()):
                    continue

            cleaned_utf8 = NOISE_TAG_REGEX.sub('', utf8)
            tokens = cleaned_utf8.split()
            if not tokens:
                continue

            offset_ms = seg.get("tOffsetMs", 0)
            w_start = (t_start_ms + offset_ms) / 1000.0
            w_dur = max(0.15, (d_dur_ms / max(1, len(tokens))) / 1000.0)

            for i, token in enumerate(tokens):
                word_clean = token.strip()
                if not word_clean:
                    continue
                start_sec = round(w_start + i * w_dur, 3)
                end_sec = round(start_sec + w_dur, 3)
                word_obj = TranscriptWord(word=word_clean, start=start_sec, end=end_sec)
                sentence_words.append(word_obj)
                all_words.append(word_obj)
                raw_text_parts.append(word_clean)

        if sentence_words:
            sent_text = " ".join(raw_text_parts)
            s_start = sentence_words[0].start
            s_end = sentence_words[-1].end
            sentences.append(TranscriptSentence(
                text=sent_text,
                start=s_start,
                end=s_end,
                words=sentence_words
            ))

    return sentences, all_words, noise_events

def parse_vtt_subtitles(vtt_content: str) -> Tuple[List[TranscriptSentence], List[TranscriptWord], List[Dict[str, Any]]]:
    """
    Parses WebVTT subtitle stream, deduplicating rolling cues and extracting
    sentence and word timestamps.
    """
    sentences: List[TranscriptSentence] = []
    all_words: List[TranscriptWord] = []
    noise_events: List[Dict[str, Any]] = []

    lines = vtt_content.splitlines()
    time_regex = re.compile(r'(\d{2}:\d{2}:\d{2}\.\d{3}|\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3}|\d{2}:\d{2}\.\d{3})')

    def parse_time(ts_str: str) -> float:
        parts = ts_str.strip().split(':')
        if len(parts) == 3:
            return float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2])
        elif len(parts) == 2:
            return float(parts[0]) * 60 + float(parts[1])
        return 0.0

    current_start = None
    current_end = None
    seen_texts = set()

    for line in lines:
        line_s = line.strip()
        if not line_s or line_s.startswith("WEBVTT") or line_s.startswith("NOTE"):
            continue

        match = time_regex.search(line_s)
        if match:
            current_start = parse_time(match.group(1))
            current_end = parse_time(match.group(2))
            continue

        if current_start is not None and current_end is not None:
            # Strip VTT inline styling / tags like <c> </c>
            clean_text = re.sub(r'<[^>]+>', '', line_s).strip()
            if not clean_text or clean_text in seen_texts:
                continue
            seen_texts.add(clean_text)

            # Noise detection
            noise_match = NOISE_TAG_REGEX.search(clean_text)
            if noise_match:
                noise_events.append({
                    "time": round(current_start, 3),
                    "tag": noise_match.group(0).strip("[]()").lower()
                })
                clean_text = NOISE_TAG_REGEX.sub('', clean_text).strip()
                if not clean_text:
                    continue

            tokens = clean_text.split()
            dur = max(0.2, current_end - current_start)
            step = dur / max(1, len(tokens))

            sent_words = []
            for i, tok in enumerate(tokens):
                w_start = round(current_start + i * step, 3)
                w_end = round(w_start + step, 3)
                w_obj = TranscriptWord(word=tok, start=w_start, end=w_end)
                sent_words.append(w_obj)
                all_words.append(w_obj)

            sentences.append(TranscriptSentence(
                text=clean_text,
                start=current_start,
                end=current_end,
                words=sent_words
            ))
            current_start = None
            current_end = None

    return sentences, all_words, noise_events

def extract_fastpath_transcript(
    meta: Dict[str, Any],
    preferred_language: str = "en"
) -> Tuple[List[TranscriptSentence], List[TranscriptWord], List[Dict[str, Any]]]:
    """
    Downloads zero media bytes! Fetches YouTube uploader subtitles or auto-captions
    directly via json3 (preferred) or vtt.
    """
    subtitles = meta.get("subtitles") or {}
    auto_captions = meta.get("automatic_captions") or {}

    selected_formats = None

    # 1. Check uploader manual subtitles first
    for lang in [preferred_language, "en", "en-US", "en-GB"]:
        if lang in subtitles:
            selected_formats = subtitles[lang]
            break

    # 2. Check auto-captions
    if not selected_formats:
        for lang in [preferred_language, "en", "en-US", "en-GB"]:
            if lang in auto_captions:
                selected_formats = auto_captions[lang]
                break

    # 3. Fallback to any language available
    if not selected_formats:
        if subtitles:
            selected_formats = next(iter(subtitles.values()))
        elif auto_captions:
            selected_formats = next(iter(auto_captions.values()))

    if not selected_formats:
        return [], [], []

    # Prioritize json3 -> vtt
    target_url = None
    target_ext = "json3"
    for fmt in selected_formats:
        if fmt.get("ext") == "json3":
            target_url = fmt.get("url")
            target_ext = "json3"
            break

    if not target_url:
        for fmt in selected_formats:
            if fmt.get("ext") == "vtt":
                target_url = fmt.get("url")
                target_ext = "vtt"
                break

    if not target_url and selected_formats:
        target_url = selected_formats[0].get("url")
        target_ext = selected_formats[0].get("ext", "vtt")

    if not target_url:
        return [], [], []

    try:
        req = urllib.request.Request(target_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=8.0) as resp:
            content = resp.read().decode('utf-8', errors='ignore')

        if target_ext == "json3" or content.strip().startswith("{"):
            raw_json = json.loads(content)
            return parse_json3_subtitles(raw_json)
        else:
            return parse_vtt_subtitles(content)
    except Exception:
        return [], [], []
