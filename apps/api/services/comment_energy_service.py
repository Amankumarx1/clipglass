import re
import math
import json
import os
from typing import List, Dict, Any, Tuple, Optional

# Regex to detect timestamp mentions:
# Matches: "12:34", "1:23:45", "0:45", "(12:34)", "[1:23:45]", "@12:34"
TIMESTAMP_REGEX = re.compile(r'(?:^|[^\d:])(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?:[^\d:]|$)')

# Energetic emojis indicative of viewer hype, humor, shock, or endorsement
ENERGY_EMOJIS = {
    '🔥', '💀', '😂', '🤣', '😱', '🤯', '👏', '⚡', '💯', '💥', '🙌',
    '🐐', '❤️', '👀', '🚨', '🤩', '😆', '🎉', '🏆', '🚀'
}

# Hype and high-energy reaction tokens (lower-cased words and phrases)
HYPE_TOKENS = {
    'lmao', 'lol', 'lmfao', 'omg', 'pog', 'poggers', 'w', 'huge w', 'goat',
    'holy', 'wtff', 'wtf', 'no way', 'sheesh', 'insane', 'fire', 'clutch',
    'yoooo', 'yooo', 'crazy', 'unreal', 'hype', 'banger', 'legend', 'dead',
    'rofl', 'kekw', 'god tier', 'brooo', 'omfg', 'lets go', 'w chat', 'clip it',
    'clip this', 'highlight', 'peak', 'shook', 'nahhh', 'cooked', 'dropped'
}

def score_comment_text_energy(text: str) -> float:
    """
    Computes a normalized text energy score [0.0 - 1.0] based on
    caps ratio (shouting/hype), exclamation intensity, energetic emojis, and hype tokens.
    """
    if not text:
        return 0.0

    raw_text = text.strip()
    clean_lower = raw_text.lower()

    # 1. Caps Ratio (shouting / hype)
    letters = [ch for ch in raw_text if ch.isalpha()]
    caps_count = sum(1 for ch in letters if ch.isupper())
    caps_ratio = (caps_count / len(letters)) if len(letters) >= 4 else 0.0
    caps_bonus = 0.35 if caps_ratio > 0.65 else (caps_ratio * 0.2)

    # 2. Exclamation & Question Marks
    excl_count = raw_text.count('!')
    q_count = raw_text.count('?')
    punc_bonus = min(0.3, (excl_count * 0.08) + (q_count * 0.05))

    # 3. Emoji intensity
    emoji_count = sum(raw_text.count(em) for em in ENERGY_EMOJIS)
    emoji_bonus = min(0.4, emoji_count * 0.15)

    # 4. Hype and reaction tokens
    hype_matches = 0
    for tok in HYPE_TOKENS:
        if " " in tok:
            if tok in clean_lower:
                hype_matches += 1
        else:
            if re.search(rf'\b{re.escape(tok)}\b', clean_lower):
                hype_matches += 1
    hype_bonus = min(0.45, hype_matches * 0.18)

    base = 0.20
    raw_energy = base + caps_bonus + punc_bonus + emoji_bonus + hype_bonus
    return min(1.0, max(0.0, raw_energy))

def extract_timestamps_from_text(text: str) -> List[int]:
    """
    Extracts all timestamp references in seconds (e.g. "12:34" -> 754s, "1:05:20" -> 3920s).
    """
    results = []
    if not text:
        return results

    matches = TIMESTAMP_REGEX.finditer(text)
    for m in matches:
        h_str, m_str, s_str = m.group(1), m.group(2), m.group(3)
        h = int(h_str) if h_str else 0
        minutes = int(m_str)
        seconds = int(s_str)
        if minutes < 60 and seconds < 60:
            total_sec = h * 3600 + minutes * 60 + seconds
            results.append(total_sec)
    return results

def parse_live_chat_replay_file(chat_file_path: str) -> List[Dict[str, Any]]:
    """
    Parses downloaded YouTube live chat replay JSON stream (.live_chat.json or .part).
    Extracts {time_sec, text, author, energy, like_count}.
    """
    messages = []
    if not os.path.exists(chat_file_path):
        return messages

    try:
        with open(chat_file_path, 'r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    d = json.loads(line)
                    offset_msec = None
                    if "videoOffsetTimeMsec" in d:
                        try:
                            offset_msec = float(d["videoOffsetTimeMsec"])
                        except (ValueError, TypeError):
                            pass

                    actions = d.get("replayChatItemAction", {}).get("actions", [])
                    for act in actions:
                        item = act.get("addChatItemAction", {}).get("item", {})
                        text_renderer = item.get("liveChatTextMessageRenderer") or item.get("liveChatPaidMessageRenderer")
                        if text_renderer:
                            runs = text_renderer.get("message", {}).get("runs", [])
                            text = "".join(r.get("text", "") for r in runs)
                            author = text_renderer.get("authorName", {}).get("simpleText", "Viewer")
                            if offset_msec is None:
                                offset_str = d.get("replayChatItemAction", {}).get("videoOffsetTimeMsec")
                                if offset_str:
                                    try:
                                        offset_msec = float(offset_str)
                                    except (ValueError, TypeError):
                                        pass

                            t_sec = (offset_msec / 1000.0) if offset_msec is not None else 0.0
                            if t_sec >= 0:
                                energy = score_comment_text_energy(text)
                                messages.append({
                                    "time_sec": t_sec,
                                    "text": text,
                                    "author": author,
                                    "energy": energy,
                                    "like_count": 0
                                })
                except Exception:
                    continue
    except Exception as e:
        print(f"Notice reading live chat replay: {e}")

    return messages

def compute_comment_energy_signal(
    duration_sec: int,
    comments: Optional[List[Dict[str, Any]]] = None,
    live_chat_path: Optional[str] = None
) -> Tuple[List[float], List[Dict[str, Any]]]:
    """
    Constructs a 1-second normalized [0.0 - 1.0] comment energy signal across the video duration.
    Also returns detected energetic chat spike peaks with top quote and timestamps.
    """
    duration_sec = max(1, duration_sec)
    energy_bins = [0.0] * duration_sec
    data_points: List[Dict[str, Any]] = []

    # 1. Parse Live Chat Replay messages
    if live_chat_path and os.path.exists(live_chat_path):
        chat_msgs = parse_live_chat_replay_file(live_chat_path)
        data_points.extend(chat_msgs)

    # 2. Parse Standard Comments (with timestamp links & likes)
    if comments:
        for c in comments:
            text = c.get("text") or ""
            likes = int(c.get("like_count") or 0)
            author = c.get("author") or "Viewer"
            timestamps = extract_timestamps_from_text(text)
            text_energy = score_comment_text_energy(text)

            # High like counts on timestamped comments strongly endorse the moment
            like_multiplier = 1.0 + 0.15 * min(8.0, math.log1p(likes))
            effective_energy = min(1.5, text_energy * like_multiplier)

            for ts in timestamps:
                if 0 <= ts < duration_sec:
                    data_points.append({
                        "time_sec": float(ts),
                        "text": text,
                        "author": author,
                        "energy": effective_energy,
                        "like_count": likes
                    })

    if not data_points:
        return energy_bins, []

    # 3. Temporal Dispersion & Sliding Window Velocity
    # Reactions start around t-1 and linger for ~8-12 seconds
    for dp in data_points:
        center_sec = int(dp["time_sec"])
        energy_val = dp["energy"]

        # Spread energy across window [-2, +10] seconds with decay
        for offset in range(-2, 11):
            target_sec = center_sec + offset
            if 0 <= target_sec < duration_sec:
                if offset < 0:
                    w = 0.5
                elif offset <= 3:
                    w = 1.0
                else:
                    w = max(0.1, 1.0 - (offset - 3) * 0.12)
                energy_bins[target_sec] += energy_val * w

    # 4. Normalize Curve
    max_energy = max(energy_bins) if energy_bins else 1.0
    if max_energy > 0:
        for s in range(duration_sec):
            norm_v = energy_bins[s] / max_energy
            energy_bins[s] = round(min(1.0, norm_v), 3)

    # 5. Extract Distinct High-Energy Spike Peaks
    peaks = []
    for s in range(1, duration_sec - 1):
        if energy_bins[s] > 0.45 and energy_bins[s] >= energy_bins[s-1] and energy_bins[s] >= energy_bins[s+1]:
            nearby = [dp for dp in data_points if abs(dp["time_sec"] - s) <= 8]
            top_quote = ""
            top_author = ""
            max_likes = -1
            if nearby:
                nearby.sort(key=lambda x: (x.get("like_count", 0), x.get("energy", 0)), reverse=True)
                top_quote = nearby[0]["text"]
                top_author = nearby[0]["author"]
                max_likes = nearby[0]["like_count"]

            peaks.append({
                "time_sec": s,
                "score": round(energy_bins[s], 3),
                "quote": top_quote[:100],
                "author": top_author,
                "like_count": max_likes
            })

    peaks.sort(key=lambda x: x["score"], reverse=True)
    filtered_peaks: List[Dict[str, Any]] = []
    for p in peaks:
        if not any(abs(p["time_sec"] - fp["time_sec"]) < 25 for fp in filtered_peaks):
            filtered_peaks.append(p)

    return energy_bins, filtered_peaks[:10]
