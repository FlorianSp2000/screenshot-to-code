from typing import Literal, TypedDict, List, Optional, Any


class SystemPrompts(TypedDict):
    html_css: str
    html_tailwind: str
    react_tailwind: str
    bootstrap: str
    ionic_tailwind: str
    vue_tailwind: str
    svg: str


class PromptContent(TypedDict):
    """Unified structure for prompt text, images, and additional files."""

    text: str
    images: List[str]
    additionalFiles: Optional[List[Any]]


Stack = Literal[
    "html_css",
    "html_tailwind",
    "react_tailwind",
    "bootstrap",
    "ionic_tailwind",
    "vue_tailwind",
    "svg",
]
