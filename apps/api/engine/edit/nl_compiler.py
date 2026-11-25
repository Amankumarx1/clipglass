from typing import Optional
from schemas.clip import ClipMoment, EditBoxOperationResult
from services.edit_box_service import EditBoxParser

def compile_natural_language_edit(
    command: str,
    clip: ClipMoment,
    max_source_duration: Optional[float] = None
) -> EditBoxOperationResult:
    """
    Translates plain-English natural language edit requests
    ("trim 3s off end", "start 5s earlier", "change captions to neon")
    into non-destructive operational edits.
    """
    return EditBoxParser.parse_and_apply(
        command=command,
        clip=clip,
        max_source_duration=max_source_duration
    )
