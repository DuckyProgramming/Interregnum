from PIL import Image

def compress(input_,output,max_colors=256):
    try:
        with Image.open(input_) as img:
            img=img.convert('P',palette=Image.ADAPTIVE,colors=max_colors)
            img.save(output,format='PNG')
        print(f"Image with reduced color palette saved to {output}")
    except Exception as e:
        print(f"Error compressing image: {e}")

inputImg = "../map/"+input("name? ")+".png"
outputImg = "compressed.png"
compress(inputImg,outputImg)