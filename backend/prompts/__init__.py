from typing import Union, Any, cast
import base64
from openai.types.chat import ChatCompletionMessageParam, ChatCompletionContentPartParam

from custom_types import InputMode
from image_generation.core import create_alt_url_mapping
from prompts.imported_code_prompts import IMPORTED_CODE_SYSTEM_PROMPTS
from prompts.screenshot_system_prompts import SYSTEM_PROMPTS
from prompts.text_prompts import SYSTEM_PROMPTS as TEXT_SYSTEM_PROMPTS
from prompts.types import Stack, PromptContent
from video.utils import assemble_claude_prompt_video


USER_PROMPT = """
Generate code for a web page that looks exactly like this.
"""

SVG_USER_PROMPT = """
Generate code for a SVG that looks exactly like this.
"""


def extract_css_from_data_url(data_url: str) -> str:
    """
    Extract CSS content from a data URL.
    
    Args:
        data_url: Data URL string (e.g., "data:text/css;base64,...")
    
    Returns:
        Decoded CSS content as string
    """
    try:
        if not data_url.startswith("data:"):
            print(f"Invalid data URL format: {data_url[:50]}...")
            return ""
        
        # Split the data URL to get the base64 part
        if "," not in data_url:
            print("No comma separator found in data URL")
            return ""
            
        header, data = data_url.split(",", 1)
        
        # Check if it's base64 encoded
        if "base64" in header:
            # Decode base64
            decoded_bytes = base64.b64decode(data)
            decoded_text = decoded_bytes.decode('utf-8', errors='ignore')
            
            # Validate that it looks like CSS content
            if len(decoded_text.strip()) == 0:
                print("Decoded CSS content is empty")
                return ""
                
            # Basic sanitization - remove any non-printable characters except newlines
            import re
            sanitized = re.sub(r'[^\x20-\x7E\n\r\t]', '', decoded_text)
            
            print(f"Successfully extracted {len(sanitized)} characters of CSS")
            return sanitized
        else:
            # If not base64, it might be URL-encoded text
            import urllib.parse
            return urllib.parse.unquote(data)
            
    except Exception as e:
        print(f"Error extracting CSS from data URL: {e}")
        print(f"Data URL header: {data_url[:100]}...")
        return ""


def build_css_prompt_section(additional_files: list[dict[str, Any]]) -> str:
    """
    Build the CSS reference section for the AI prompt.
    
    Args:
        additional_files: List of additional files from frontend
    
    Returns:
        Formatted CSS prompt section
    """
    print(f"[CSS DEBUG] Processing {len(additional_files) if additional_files else 0} additional files")
    
    if not additional_files:
        return ""
    
    # Filter for CSS/style files
    css_files = [f for f in additional_files if f.get('category') == 'style']
    print(f"[CSS DEBUG] Found {len(css_files)} CSS files")
    
    if not css_files:
        return ""
    
    css_prompt = "\n\nYou should use parts of the following (s)css reference where suitable:\n\n"
    
    for i, css_file in enumerate(css_files):
        print(f"[CSS DEBUG] Processing CSS file {i+1}:")
        print(f"  - Category: {css_file.get('category')}")
        print(f"  - FileName: {css_file.get('fileName', 'MISSING')}")
        print(f"  - FileType: {css_file.get('fileType', 'MISSING')}")
        
        data_url = css_file.get('dataUrl', '')
        print(f"  - Data URL length: {len(data_url)}")
        print(f"  - Data URL prefix: {data_url[:100]}")
        
        # Get filename from the new structure
        file_name = css_file.get('fileName', f'styles-{i+1}.css')
        
        print(f"  - Using filename: {file_name}")
        
        css_content = extract_css_from_data_url(data_url)
        print(f"  - Extracted content length: {len(css_content)}")
        print(f"  - Content preview (first 200 chars): {repr(css_content[:200])}")
        
        if css_content:
            css_prompt += f"/* {file_name} */\n"
            css_prompt += f"```css\n{css_content.strip()}\n```\n\n"
    
    print(f"[CSS DEBUG] Final CSS prompt length: {len(css_prompt)}")
    return css_prompt


async def create_prompt(
    stack: Stack,
    input_mode: InputMode,
    generation_type: str,
    prompt: PromptContent,
    history: list[dict[str, Any]],
    is_imported_from_code: bool,
) -> tuple[list[ChatCompletionMessageParam], dict[str, str]]:

    image_cache: dict[str, str] = {}

    # If this generation started off with imported code, we need to assemble the prompt differently
    if is_imported_from_code:
        original_imported_code = history[0]["text"]
        prompt_messages = assemble_imported_code_prompt(original_imported_code, stack)
        for index, item in enumerate(history[1:]):
            role = "user" if index % 2 == 0 else "assistant"
            message = create_message_from_history_item(item, role)
            prompt_messages.append(message)
    else:
        # Assemble the prompt for non-imported code
        additional_files = prompt.get("additionalFiles", [])
        
        if input_mode == "image":
            image_url = prompt["images"][0]
            prompt_messages = assemble_prompt(image_url, stack, additional_files)
        elif input_mode == "text":
            prompt_messages = assemble_text_prompt(prompt["text"], stack, additional_files)
        else:
            # Default to image mode for backward compatibility
            image_url = prompt["images"][0]
            prompt_messages = assemble_prompt(image_url, stack, additional_files)

        if generation_type == "update":
            # Transform the history tree into message format
            for index, item in enumerate(history):
                role = "assistant" if index % 2 == 0 else "user"
                message = create_message_from_history_item(item, role)
                prompt_messages.append(message)

            image_cache = create_alt_url_mapping(history[-2]["text"])

    if input_mode == "video":
        video_data_url = prompt["images"][0]
        prompt_messages = await assemble_claude_prompt_video(video_data_url)

    return prompt_messages, image_cache


def create_message_from_history_item(
    item: dict[str, Any], role: str
) -> ChatCompletionMessageParam:
    """
    Create a ChatCompletionMessageParam from a history item.
    Handles both text-only and text+images content.
    """
    # Check if this is a user message with images
    if role == "user" and item.get("images") and len(item["images"]) > 0:
        # Create multipart content for user messages with images
        user_content: list[ChatCompletionContentPartParam] = []

        # Add all images first
        for image_url in item["images"]:
            user_content.append(
                {
                    "type": "image_url",
                    "image_url": {"url": image_url, "detail": "high"},
                }
            )

        # Add CSS content if present
        css_section = ""
        if item.get("additionalFiles"):
            css_section = build_css_prompt_section(item["additionalFiles"])
        
        # Add text content with CSS
        text_with_css = item["text"] + css_section
        user_content.append(
            {
                "type": "text",
                "text": text_with_css,
            }
        )

        return cast(
            ChatCompletionMessageParam,
            {
                "role": role,
                "content": user_content,
            },
        )
    else:
        # Regular text-only message
        return cast(
            ChatCompletionMessageParam,
            {
                "role": role,
                "content": item["text"],
            },
        )


def assemble_imported_code_prompt(
    code: str, stack: Stack
) -> list[ChatCompletionMessageParam]:
    system_content = IMPORTED_CODE_SYSTEM_PROMPTS[stack]

    user_content = (
        "Here is the code of the app: " + code
        if stack != "svg"
        else "Here is the code of the SVG: " + code
    )

    return [
        {
            "role": "system",
            "content": system_content + "\n " + user_content,
        }
    ]


def assemble_prompt(
    image_data_url: str,
    stack: Stack,
    additional_files: list[dict[str, Any]] = None,
) -> list[ChatCompletionMessageParam]:
    system_content = SYSTEM_PROMPTS[stack]
    user_prompt = USER_PROMPT if stack != "svg" else SVG_USER_PROMPT
    
    # Add CSS reference if available
    css_section = build_css_prompt_section(additional_files or [])
    user_prompt_with_css = user_prompt + css_section

    user_content: list[ChatCompletionContentPartParam] = [
        {
            "type": "image_url",
            "image_url": {"url": image_data_url, "detail": "high"},
        },
        {
            "type": "text",
            "text": user_prompt_with_css,
        },
    ]
    return [
        {
            "role": "system",
            "content": system_content,
        },
        {
            "role": "user",
            "content": user_content,
        },
    ]


def assemble_text_prompt(
    text_prompt: str,
    stack: Stack,
    additional_files: list[dict[str, Any]] = None,
) -> list[ChatCompletionMessageParam]:

    system_content = TEXT_SYSTEM_PROMPTS[stack]
    
    # Add CSS reference if available
    css_section = build_css_prompt_section(additional_files or [])
    user_prompt_with_css = "Generate UI for " + text_prompt + css_section

    return [
        {
            "role": "system",
            "content": system_content,
        },
        {
            "role": "user",
            "content": user_prompt_with_css,
        },
    ]
