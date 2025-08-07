import { useRef } from "react";
import { toast } from "react-hot-toast";
import { Cross2Icon, ImageIcon } from "@radix-ui/react-icons";
// import { Button } from "./ui/button";

// Helper function to convert file to data URL
function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

interface Props {
  updateImages: string[];
  setUpdateImages: (images: string[]) => void;
}

export function UpdateImagePreview({ updateImages, setUpdateImages }: Props) {
  const removeImage = (index: number) => {
    const newImages = updateImages.filter((_, i) => i !== index);
    setUpdateImages(newImages);
  };

  if (updateImages.length === 0) return null;

  return (
    <div className="mb-2">
      <div className="flex gap-2 overflow-x-auto py-2">
        {updateImages.map((image, index) => (
          <div key={index} className="relative flex-shrink-0 group">
            <img
              src={image}
              alt={`Reference ${index + 1}`}
              className="h-12 w-12 object-cover rounded border border-gray-200 dark:border-gray-600"
            />
            <button
              onClick={() => removeImage(index)}
              className="absolute -top-1 -right-1 h-4 w-4 bg-gray-800 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Cross2Icon className="h-2 w-2" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function UpdateImageUpload({ updateImages, setUpdateImages }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);


  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      try {
        const newImagePromises = Array.from(files).map(file => fileToDataURL(file));
        const newImages = await Promise.all(newImagePromises);
        setUpdateImages([...updateImages, ...newImages]);
      } catch (error) {
        toast.error("Error reading image files");
        console.error("Error reading files:", error);
      }
    }
  };

  return (
    <div className="relative inline-block">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg"
        onChange={handleFileInputChange}
        className="hidden"
      />
      
      {/* Image button styled to match the design */}
      <div 
        className="flex items-center p-2 rounded-full hover:bg-gray-200 cursor-pointer"
        onClick={handleButtonClick}
        title={updateImages.length > 0 ? "Add more images" : "Add reference images"}
      >
        <ImageIcon className="h-4 w-4" />
      </div>
      
    </div>
  );
}

export default UpdateImageUpload;
