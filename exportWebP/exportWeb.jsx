//	--------
// 	Traitement et export en WebP
//	(compressionLossy à 65%) depuis le dossier -export/-src
//
//	Pré-requis : Photoshop 23.6+
//	Sur le Bureau, un dossier "-export" contenant un sous-dossier "-src" 
//	avec vos images (.jpg, .jpeg, .png, .webp, .aiff)
//	--------

var exportFolder = Folder("~/Desktop/-export");               // Dossier de destination
var sourceFolder = Folder(exportFolder.fsName + "/-src");         // Dossier source

// Vérifier l'existence des dossiers
if (!exportFolder.exists) {alert("Le dossier -export n'existe pas sur le bureau.");} 
else if (!sourceFolder.exists) {alert("Le sous-dossier -src n'existe pas dans -export.");} 

else {
    // Récupérer tous les fichiers d'image dans "-src"
    var files = sourceFolder.getFiles(function(f) {return f instanceof File && f.name.match(/\.(jpg|jpeg|png|webp|aiff)$/i);});
    if (files.length === 0) {alert("Aucun fichier image trouvé dans -src.");}
    
     else {
        // Fonction utilitaire : convertit une chaîne en typeID Photoshop
        var s2t = function(s) { return app.stringIDToTypeID(s); };

        // Fonction pour sauvegarder en WebP via ActionDescriptor
        function saveWebP(compType, compValue, xmpData, exifData, psData, asCopy, filename, save_path) {
            var webPSavePath = save_path + "/" + filename + ".webp";  // Chemin complet de sauvegarde
            var webPFile = new File(webPSavePath);

            var descriptor = new ActionDescriptor();  // Descripteur principal
            var descriptor2 = new ActionDescriptor(); // Options spécifiques au WebP

            // Définir le mode de compression (lossy ou lossless)
            descriptor2.putEnumerated(s2t("compression"), s2t("WebPCompression"), s2t(compType));
            if (compType === "compressionLossy") {
                // Définir la qualité (0 à 100) pour une compression avec perte
                descriptor2.putInteger(s2t("quality"), compValue);
            }

            // Options de métadonnées (désactivées par défaut)
            /*
            descriptor2.putBoolean(s2t("includeXMPData"), xmpData);
            descriptor2.putBoolean(s2t("includeEXIFData"), exifData);
            descriptor2.putBoolean(s2t("includePsExtras"), psData);
            */

            // Assembler les paramètres dans le descripteur principal
            descriptor.putObject(s2t("as"), s2t("WebPFormat"), descriptor2);
            descriptor.putPath(s2t("in"), webPFile);
            descriptor.putBoolean(s2t("copy"), asCopy);
            descriptor.putBoolean(s2t("lowerCase"), true); // Force l'extension en minuscules

            // Exécuter l'action "save" sans afficher de boîte de dialogue
            executeAction(s2t("save"), descriptor, DialogModes.NO);
        }

        // Fonction pour exporter une variante redimensionnée de l'image
        function exportWebPVariant(doc, originalName, suffix, width) {
            var tempDoc = doc.duplicate();  // Créer une copie pour ne pas modifier l'original
            tempDoc.resizeImage(UnitValue(width, "px"), null, null, ResampleMethod.BICUBIC);
            var fileName = originalName + suffix;  // Ajouter un suffixe pour distinguer les tailles
            saveWebP("compressionLossy", 65, false, false, false, true, fileName, exportFolder.fsName);
            tempDoc.close(SaveOptions.DONOTSAVECHANGES);
        }

        // Parcourir et traiter chaque fichier trouvé
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            try {
                var doc = open(file);  // Ouvrir le fichier dans Photoshop
            } catch (e) {
                alert("Impossible d'ouvrir " + file.name + ": " + e.message);
                continue;
            }

            // Extraire le nom de fichier sans extension
            var originalName = doc.name.replace(/\.[^\.]+$/, '');

            // Appliquer les réglages de base à l'image :
            // - Définir la résolution à 72 dpi (sans rééchantillonnage)
            // - Appliquer un filtre d'accentuation
            // - Corriger automatiquement les niveaux
            doc.resizeImage(undefined, undefined, 72, ResampleMethod.NONE);
            doc.activeLayer.applySharpen();
            doc.activeLayer.autoLevels();

            // Exporter trois variantes de l'image
            exportWebPVariant(doc, originalName, "", 1000);    // Variante 1000px (taille originale)
            exportWebPVariant(doc, originalName, "-md", 565);   // Variante moyenne 565px
            exportWebPVariant(doc, originalName, "-sm", 360);   // Variante réduite 360px
            doc.close(SaveOptions.DONOTSAVECHANGES);  // Fermer l'image originale sans sauvegarder
        }
        alert("Toutes les images ont été exportées.");
    }
}