import os
from openai import OpenAI
import tempfile
import cloudinary
import cloudinary.uploader
from cloudinary.utils import cloudinary_url
def describe(image_url:str):

    TOKEN1="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"
    TOKEN2="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"
    client = OpenAI(
        base_url="https://router.huggingface.co/v1",
        api_key=TOKEN2,
    )
    completion = client.chat.completions.create(
        model="Qwen/Qwen2.5-VL-72B-Instruct:hyperbolic",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Summarize the content of the picture in one sentence."
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url":image_url
                        }
                    }
                ]
            }
        ],
    )
    return completion.choices[0].message.content

def uploadfile(file):
    apisecret="axvrVE6_AzAwe2nW5tVMwro5Dbc"

    # Configuration       
    cloudinary.config( 
        cloud_name = "dxfeqjihb", 
        api_key = "294953549133193", 
        api_secret = apisecret,
        secure=True
    )

# Upload an image
    upload_result = cloudinary.uploader.upload(file,
                                           public_id=file.filename)
    return upload_result["secure_url"]