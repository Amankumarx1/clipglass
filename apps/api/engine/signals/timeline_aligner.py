from typing import List, Dict, Any, Optional
from schemas.clip import TranscriptWord, TranscriptSentence
from engine.probe.metadata_probe import ProbeResult

class TimelineSignals:
    def __init__(self, duration_seconds: int):
        self.duration_seconds = max(1, duration_seconds)
        self.heatmap: List[float] = [0.0] * self.duration_seconds
        self.speech_rate: List[float] = [0.0] * self.duration_seconds
        self.loudness: List[float] = [0.0] * self.duration_seconds
        self.burst: List[float] = [0.0] * self.duration_seconds
        self.scene_cuts: List[float] = [0.0] * self.duration_seconds
        self.chapters: List[float] = [0.0] * self.duration_seconds
        self.composite_energy: List[float] = [0.0] * self.duration_seconds

def align_timeline_signals(
    probe: ProbeResult,
    audio_loudness: Optional[List[float]] = None,
    audio_burst: Optional[List[float]] = None
) -> TimelineSignals:
    """
    Synthesizes and aligns all multimodal timeline signals onto a continuous
    1-second normalized grid [0.0, 1.0].
    """
    dur = probe.duration
    signals = TimelineSignals(dur)

    # 1. Heatmap (Most-Replayed)
    if probe.heatmap:
        for s in range(min(dur, len(probe.heatmap))):
            signals.heatmap[s] = round(probe.heatmap[s], 4)

    # 2. Scene Cuts
    if probe.storyboard_cuts:
        for s in range(min(dur, len(probe.storyboard_cuts))):
            signals.scene_cuts[s] = round(probe.storyboard_cuts[s], 4)

    # 3. Chapter Boundaries
    for ch in probe.chapters:
        st = int(ch.get("start_time", 0))
        if 0 <= st < dur:
            # Chapter marker peak decaying over 5 seconds
            for offset in range(5):
                t = st + offset
                if t < dur:
                    signals.chapters[t] = max(signals.chapters[t], round(0.9 * (1.0 - offset * 0.18), 3))

    # 4. Speech Rate (words per second)
    word_counts = [0] * dur
    for w in probe.words:
        sec = int(w.start)
        if 0 <= sec < dur:
            word_counts[sec] += 1

    for s in range(dur):
        # 3.0 words per second is ~180 WPM (high engagement). Normalize: 0-4 WPS -> 0.0 to 1.0
        wps = word_counts[s]
        signals.speech_rate[s] = round(min(1.0, wps / 3.5), 3)

    # 5. Silence-to-Speech Bursts from transcript pauses
    # If a pause > 1.2s precedes speech, mark burst at speech onset
    last_word_end = 0.0
    for w in probe.words:
        pause = w.start - last_word_end
        if pause >= 1.2:
            sec = int(w.start)
            if 0 <= sec < dur:
                signals.burst[sec] = min(1.0, round(signals.burst[sec] + 0.75, 3))
        last_word_end = w.end

    # 6. Audio loudness & acoustic bursts (if deep audio pass was run)
    if audio_loudness:
        for s in range(min(dur, len(audio_loudness))):
            signals.loudness[s] = round(audio_loudness[s], 4)

    if audio_burst:
        for s in range(min(dur, len(audio_burst))):
            signals.burst[s] = max(signals.burst[s], round(audio_burst[s], 4))

    # 7. Composite Activity Fusion
    for s in range(dur):
        hm = signals.heatmap[s]
        sr = signals.speech_rate[s]
        ld = signals.loudness[s]
        bt = signals.burst[s]
        sc = signals.scene_cuts[s]
        cp = signals.chapters[s]

        # Weights: 40% heatmap, 25% speech rate, 15% loudness/burst, 10% cut, 10% chapter
        comp = (
            hm * 0.40 +
            sr * 0.25 +
            max(ld, bt) * 0.15 +
            sc * 0.10 +
            cp * 0.10
        )
        signals.composite_energy[s] = round(min(1.0, max(0.0, comp)), 4)

    return signals
