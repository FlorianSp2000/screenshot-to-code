import re


def extract_html_content(text: str):
    # First, try to extract from markdown code blocks
    markdown_match = re.search(r"```html\s*(.*?)\s*```", text, re.DOTALL)
    if markdown_match:
        html_code = markdown_match.group(1).strip()
        # Check if this contains <html> tags
        if "<html" in html_code:
            return html_code
    
    # Second, try to find content within <html> tags and include the tags themselves
    match = re.search(r"(<html.*?>.*?</html>)", text, re.DOTALL)
    if match:
        return match.group(1)
    
    # Third, try to extract just the HTML content from markdown without requiring <html> tags
    if markdown_match:
        return markdown_match.group(1).strip()
    
    # If no HTML structure found, log warning and return original text
    print(
        "[HTML Extraction] No <html> tags or markdown HTML blocks found in the generated content. First 200 chars: " + text[:200]
    )
    return text
