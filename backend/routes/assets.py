import base64
import uuid
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import Response
import tempfile
import os
from pathlib import Path

router = APIRouter()

# In-memory store for assets (in production, use Redis or database)
asset_store: Dict[str, Dict[str, Any]] = {}

@router.post("/assets/upload")
async def upload_assets(assets: list[dict]):
    """
    Upload assets and return URLs for use in generated code.
    
    Args:
        assets: List of asset files with dataUrl, fileName, etc.
        
    Returns:
        List of asset URLs that can be used in HTML
    """
    asset_urls = []
    
    for asset in assets:
        # Generate unique asset ID
        asset_id = str(uuid.uuid4())
        
        # Store asset data
        asset_store[asset_id] = {
            'dataUrl': asset.get('dataUrl'),
            'fileName': asset.get('fileName', f'asset-{asset_id}'),
            'fileType': asset.get('fileType', 'application/octet-stream'),
            'category': asset.get('category')
        }
        
        # Create accessible URL
        asset_url = f"/assets/{asset_id}"
        asset_urls.append({
            'id': asset_id,
            'url': asset_url,
            'fileName': asset.get('fileName'),
            'category': asset.get('category')
        })
        
        print(f"[ASSET] Stored asset {asset_id}: {asset.get('fileName')}")
    
    return asset_urls

@router.get("/assets/{asset_id}")
async def serve_asset(asset_id: str):
    """
    Serve an asset by ID.
    
    Args:
        asset_id: The unique asset identifier
        
    Returns:
        The asset file content with appropriate headers
    """
    if asset_id not in asset_store:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    asset = asset_store[asset_id]
    data_url = asset['dataUrl']
    file_type = asset['fileType']
    
    # Extract data from data URL
    if not data_url.startswith('data:'):
        raise HTTPException(status_code=400, detail="Invalid data URL")
    
    try:
        # Parse data URL: data:image/png;base64,iVBORw0KGgoAAAANS...
        header, data = data_url.split(',', 1)
        decoded_data = base64.b64decode(data)
        
        # Extract MIME type from header
        if ';' in header:
            mime_type = header.split(':')[1].split(';')[0]
        else:
            mime_type = file_type
            
        return Response(
            content=decoded_data,
            media_type=mime_type,
            headers={
                "Cache-Control": "public, max-age=3600",  # Cache for 1 hour
                "Content-Disposition": f'inline; filename="{asset["fileName"]}"'
            }
        )
        
    except Exception as e:
        print(f"[ASSET ERROR] Failed to serve asset {asset_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to serve asset")

@router.delete("/assets/{asset_id}")
async def delete_asset(asset_id: str):
    """
    Delete an asset by ID.
    
    Args:
        asset_id: The unique asset identifier
    """
    if asset_id in asset_store:
        del asset_store[asset_id]
        return {"message": "Asset deleted"}
    else:
        raise HTTPException(status_code=404, detail="Asset not found")

@router.get("/assets")
async def list_assets():
    """
    List all stored assets.
    """
    return {
        "count": len(asset_store),
        "assets": [
            {
                "id": asset_id,
                "fileName": asset["fileName"],
                "category": asset["category"],
                "url": f"/assets/{asset_id}"
            }
            for asset_id, asset in asset_store.items()
        ]
    }