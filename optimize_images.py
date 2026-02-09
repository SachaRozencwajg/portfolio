from PIL import Image
import os
import glob

def optimize_images(directory, max_width=1200, quality=80):
    """
    Optimise les images d'un répertoire :
    1. Convertit en WebP
    2. Redimensionne si > max_width
    3. Compresse
    """
    # Extensions à traiter
    extensions = ['*.jpg', '*.jpeg', '*.png']
    files = []
    
    for ext in extensions:
        files.extend(glob.glob(os.path.join(directory, ext)))
        
    print(f"🖼  {len(files)} images trouvées pour optimisation...")
    
    for file_path in files:
        filename = os.path.basename(file_path)
        name, ext = os.path.splitext(filename)
        
        # Ignorer si déjà optimisé
        webp_path = os.path.join(directory, f"{name}.webp")
        if os.path.exists(webp_path):
            print(f"⏩ Déjà optimisé : {filename}")
            continue
            
        try:
            with Image.open(file_path) as img:
                # Convertir en RGB si nécessaire (pour PNG transparents -> JPG, mais ici on fait WebP qui supporte la transparence)
                if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                    # Garder la transparence pour WebP
                    pass
                else:
                    img = img.convert('RGB')
                
                # Redimensionner si trop grand
                if img.width > max_width:
                    ratio = max_width / img.width
                    new_height = int(img.height * ratio)
                    img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
                    print(f"📏 Redimensionné : {filename} ({img.width}x{img.height})")
                
                # Sauvegarder en WebP
                img.save(webp_path, 'WEBP', quality=quality)
                
                # Calculer le gain
                orig_size = os.path.getsize(file_path)
                new_size = os.path.getsize(webp_path)
                gain = (orig_size - new_size) / orig_size * 100
                
                print(f"✅ Optimisé : {filename} -> {name}.webp (-{gain:.1f}%)")
                
        except Exception as e:
            print(f"❌ Erreur sur {filename}: {e}")

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Vérifier si Pillow est installé
    try:
        import PIL
        optimize_images(current_dir)
        print("\n✨ Optimisation terminée ! N'oubliez pas de mettre à jour vos balises <img> dans le HTML pour utiliser les fichiers .webp")
    except ImportError:
        print("⚠️  La librairie Pillow n'est pas installée.")
        print("    Exécutez : pip install Pillow")
