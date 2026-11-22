import re
from typing import Tuple, Optional, Dict, Any
from schemas.clip import ClipMoment, EditBoxOperationResult

class EditBoxParser:
    """
    Translates plain-English natural language edit requests into validated,
    deterministic operations on ClipMoment boundaries, framing, or caption presets.
    Clean-room implementation of operational non-destructive edits.
    """

    MIN_CLIP_DURATION = 15.0
    MAX_CLIP_DURATION = 180.0

    @classmethod
    def parse_and_apply(
        cls,
        command: str,
        clip: ClipMoment,
        max_source_duration: Optional[float] = None
    ) -> EditBoxOperationResult:
        cmd = command.strip().lower()
        curr_start = clip.start
        curr_end = clip.end
        curr_dur = round(curr_end - curr_start, 2)
        total_bound = max_source_duration or (curr_end + 300.0)

        # 1. "start X seconds later / trim start by X"
        if any(w in cmd for w in ["later", "forward"]) or ("trim start" in cmd or "cut start" in cmd):
            m = re.search(r'(\d+(?:\.\d+)?)\s*(?:s|sec|seconds?)', cmd)
            if m:
                seconds = float(m.group(1))
                new_start = min(curr_end - cls.MIN_CLIP_DURATION, curr_start + seconds)
                new_dur = round(curr_end - new_start, 2)
                clip.start = round(new_start, 2)
                clip.duration = round(new_dur, 2)
                return EditBoxOperationResult(
                    success=True,
                    operation="trim_start",
                    delta=seconds,
                    newStart=clip.start,
                    newEnd=clip.end,
                    newDuration=clip.duration,
                    message=f"Moved start {seconds}s later (new duration: {clip.duration}s)."
                )

        # 2. "start X seconds earlier / move start back by X"
        if any(w in cmd for w in ["earlier", "before", "back"]) or ("extend start" in cmd):
            m = re.search(r'(\d+(?:\.\d+)?)\s*(?:s|sec|seconds?)', cmd)
            if m:
                seconds = float(m.group(1))
                new_start = max(0.0, curr_start - seconds)
                new_dur = round(curr_end - new_start, 2)
                if new_dur > cls.MAX_CLIP_DURATION:
                    new_start = max(0.0, curr_end - cls.MAX_CLIP_DURATION)
                    new_dur = cls.MAX_CLIP_DURATION
                clip.start = round(new_start, 2)
                clip.duration = round(new_dur, 2)
                return EditBoxOperationResult(
                    success=True,
                    operation="extend_start",
                    delta=-seconds,
                    newStart=clip.start,
                    newEnd=clip.end,
                    newDuration=clip.duration,
                    message=f"Moved start {seconds}s earlier (new duration: {clip.duration}s)."
                )

        # 3. "make it X seconds shorter / trim X seconds off end"
        if any(w in cmd for w in ["shorter", "off end", "from end"]) or ("trim" in cmd and "start" not in cmd):
            m = re.search(r'(\d+(?:\.\d+)?)\s*(?:s|sec|seconds?)', cmd)
            if m:
                seconds = float(m.group(1))
                new_end = max(curr_start + cls.MIN_CLIP_DURATION, curr_end - seconds)
                new_dur = round(new_end - curr_start, 2)
                clip.end = round(new_end, 2)
                clip.duration = round(new_dur, 2)
                return EditBoxOperationResult(
                    success=True,
                    operation="trim_end",
                    delta=-seconds,
                    newStart=clip.start,
                    newEnd=clip.end,
                    newDuration=clip.duration,
                    message=f"Shortened clip ending by {seconds}s (new duration: {clip.duration}s)."
                )

        # 4. "make it X seconds longer / extend by X"
        if any(w in cmd for w in ["longer", "extend", "add"]):
            m = re.search(r'(\d+(?:\.\d+)?)\s*(?:s|sec|seconds?)', cmd)
            if m:
                seconds = float(m.group(1))
                new_end = min(total_bound, curr_end + seconds)
                new_dur = round(new_end - curr_start, 2)
                if new_dur > cls.MAX_CLIP_DURATION:
                    new_end = curr_start + cls.MAX_CLIP_DURATION
                    new_dur = cls.MAX_CLIP_DURATION
                clip.end = round(new_end, 2)
                clip.duration = round(new_dur, 2)
                return EditBoxOperationResult(
                    success=True,
                    operation="extend_end",
                    delta=seconds,
                    newStart=clip.start,
                    newEnd=clip.end,
                    newDuration=clip.duration,
                    message=f"Extended clip ending by {seconds}s (new duration: {clip.duration}s)."
                )

        # 5. "set duration to X seconds / make duration X s"
        m = re.search(r'(?:set\s+duration\s+to\s+|make\s+duration\s+|target\s+duration\s+|duration\s+)(\d+(?:\.\d+)?)\s*(?:s|sec|seconds?)?', cmd)
        if m:
            target_dur = max(cls.MIN_CLIP_DURATION, min(cls.MAX_CLIP_DURATION, float(m.group(1))))
            new_end = min(total_bound, curr_start + target_dur)
            clip.end = round(new_end, 2)
            clip.duration = round(clip.end - clip.start, 2)
            return EditBoxOperationResult(
                success=True,
                operation="set_duration",
                delta=None,
                newStart=clip.start,
                newEnd=clip.end,
                newDuration=clip.duration,
                message=f"Adjusted clip duration to {clip.duration}s."
            )

        # 6. Caption style preset switch
        caption_styles = {
            'viral pop': 'viral_pop',
            'minimalist': 'minimalist',
            'minimal': 'minimalist',
            'neon cyber': 'neon_cyber',
            'cyber': 'neon_cyber',
            'karaoke': 'karaoke',
            'headline': 'headline',
            'dynamic box': 'dynamic_box',
            'box': 'dynamic_box'
        }
        for kw, style_key in caption_styles.items():
            if kw in cmd:
                clip.captionPreset = style_key
                return EditBoxOperationResult(
                    success=True,
                    operation="set_caption_preset",
                    delta=None,
                    newStart=clip.start,
                    newEnd=clip.end,
                    newDuration=clip.duration,
                    message=f"Switched subtitle style to '{style_key}'."
                )

        # 7. Reframe mode switch
        if "split" in cmd:
            clip.reframeMode = "split"
            return EditBoxOperationResult(
                success=True,
                operation="set_reframe_mode",
                delta=None,
                newStart=clip.start,
                newEnd=clip.end,
                newDuration=clip.duration,
                message="Switched reframe mode to 'split' (Top speaker / Bottom context)."
            )
        elif "center" in cmd:
            clip.reframeMode = "center"
            return EditBoxOperationResult(
                success=True,
                operation="set_reframe_mode",
                delta=None,
                newStart=clip.start,
                newEnd=clip.end,
                newDuration=clip.duration,
                message="Switched reframe mode to 'center' crop."
            )
        elif "follow" in cmd or "face" in cmd or "tracking" in cmd:
            clip.reframeMode = "follow-face"
            return EditBoxOperationResult(
                success=True,
                operation="set_reframe_mode",
                delta=None,
                newStart=clip.start,
                newEnd=clip.end,
                newDuration=clip.duration,
                message="Switched reframe mode to smoothed 'follow-face' tracking."
            )

        # 8. Title update: "set title to X" / "rename to X"
        m = re.search(r'(?:set\s+title\s+to\s+|rename\s+to\s+|change\s+title\s+to\s+)(.+)', cmd)
        if m:
            new_title = m.group(1).strip()
            clip.title = new_title
            return EditBoxOperationResult(
                success=True,
                operation="set_title",
                delta=None,
                newStart=clip.start,
                newEnd=clip.end,
                newDuration=clip.duration,
                message=f"Updated clip title to: \"{new_title}\""
            )

        # 9. Hook update: "set hook to X" / "change hook to X"
        m = re.search(r'(?:set\s+hook\s+to\s+|change\s+hook\s+to\s+)(.+)', cmd)
        if m:
            new_hook = m.group(1).strip().upper()
            clip.hook = new_hook
            return EditBoxOperationResult(
                success=True,
                operation="set_hook",
                delta=None,
                newStart=clip.start,
                newEnd=clip.end,
                newDuration=clip.duration,
                message=f"Updated opening hook banner to: \"{new_hook}\""
            )

        return EditBoxOperationResult(
            success=False,
            operation="unknown",
            delta=None,
            newStart=clip.start,
            newEnd=clip.end,
            newDuration=clip.duration,
            message=f"Command '{command}' not recognized. Try 'make it 5s longer', 'start 3s earlier', 'style to neon cyber', or 'set title to ...'."
        )
