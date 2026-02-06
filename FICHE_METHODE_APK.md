# 📋 FICHE MÉTHODE - MODIFIER ET COMPILER L'APK STUDENTFLOW

## 📁 Structure des dossiers importants

```
c:\dev\StudentFlowApp\
├── www\                          ← CODE SOURCE WEB (modifier ici)
│   ├── index.html               ← FICHIER PRINCIPAL chargé par le navigateur
│   ├── studentflow_ultimate_pro.html
│   ├── css\
│   ├── js\
│   └── icons\
├── android\                      ← PROJET ANDROID
│   └── app\src\main\assets\public\  ← COPIER LES FICHIERS ICI
└── StudentFlow-FINAL.apk       ← APK FINAL PRÊT À INSTALLER
```

---

## 🔧 ÉTAPES POUR METTRE À JOUR L'APK

### 1️⃣ Modifier le code web
- Ouvrir et modifier les fichiers dans `c:\dev\StudentFlowApp\www\`
- **Toujours tester en web d'abord** sur `http://localhost:8888`
- Vérifier que tout fonctionne avant de compiler l'APK

### 2️⃣ Copier les fichiers vers Android
```powershell
# Copier les fichiers HTML principaux
Copy-Item -Path "c:\dev\StudentFlowApp\www\index.html" -Destination "c:\dev\StudentFlowApp\android\app\src\main\assets\public\index.html" -Force

Copy-Item -Path "c:\dev\StudentFlowApp\www\studentflow_ultimate_pro.html" -Destination "c:\dev\StudentFlowApp\android\app\src\main\assets\public\studentflow_ultimate_pro.html" -Force

# Copier les autres fichiers si modifiés (CSS, JS, images...)
Copy-Item -Path "c:\dev\StudentFlowApp\www\css\*" -Destination "c:\dev\StudentFlowApp\android\app\src\main\assets\public\css\" -Recurse -Force
Copy-Item -Path "c:\dev\StudentFlowApp\www\js\*" -Destination "c:\dev\StudentFlowApp\android\app\src\main\assets\public\js\" -Recurse -Force
Copy-Item -Path "c:\dev\StudentFlowApp\www\icons\*" -Destination "c:\dev\StudentFlowApp\android\app\src\main\assets\public\icons\" -Recurse -Force
```

### 3️⃣ Compiler l'APK
```powershell
cd c:\dev\StudentFlowApp\android
.\gradlew.bat assembleRelease
```

### 4️⃣ Récupérer l'APK final
```powershell
# Copier avec un nom clair
Copy-Item -Path "c:\dev\StudentFlowApp\android\app\build\outputs\apk\release\app-release.apk" -Destination "c:\dev\StudentFlowApp\StudentFlow-FINAL.apk" -Force
```

---

## ⚡ COMMANDE RAPIDE (tout faire d'un coup)

```powershell
cd c:\dev\StudentFlowApp\android; .\gradlew.bat assembleRelease; Copy-Item -Path "app\build\outputs\apk\release\app-release.apk" -Destination "..\StudentFlow-FINAL.apk" -Force
```

---

## 🎯 Points importants à retenir

### ✅ À FAIRE
- Toujours modifier dans `www\` d'abord
- Toujours tester en web avant de compiler l'APK
- Toujours copier les fichiers avant de compiler
- L'APK est auto-signé avec le debug keystore (pas besoin de signer manuellement)

### ❌ À ÉVITER
- Modifier directement les fichiers dans `android\` (perdrait les modifications)
- Compiler sans copier les fichiers (aurait l'ancienne version)
- Oublier de tester en web (risque d'erreurs dans l'APK)

---

## 📝 Exemple pratique

Si vous modifiez `index.html` pour ajouter une nouvelle fonction :

1. **Modifier** `c:\dev\StudentFlowApp\www\index.html`
2. **Tester** sur `http://localhost:8888`
3. **Copier** :
   ```powershell
   Copy-Item -Path "c:\dev\StudentFlowApp\www\index.html" -Destination "c:\dev\StudentFlowApp\android\app\src\main\assets\public\index.html" -Force
   ```
4. **Compiler** :
   ```powershell
   cd c:\dev\StudentFlowApp\android
   .\gradlew.bat assembleRelease
   ```
5. **Installer** `StudentFlow-FINAL.apk` sur BlueStacks

---

## 🔍 Emplacements des fichiers clés

| Fichier | Source (à modifier) | Destination (copie automatique) |
|---------|---------------------|--------------------------------|
| Page principale | `www\index.html` | `android\app\src\main\assets\public\index.html` |
| Page complète | `www\studentflow_ultimate_pro.html` | `android\app\src\main\assets\public\studentflow_ultimate_pro.html` |
| Styles | `www\css\*` | `android\app\src\main\assets\public\css\*` |
| Scripts | `www\js\*` | `android\app\src\main\assets\public\js\*` |
| Icônes | `www\icons\*` | `android\app\src\main\assets\public\icons\*` |

---

## 📲 Installation sur BlueStacks

1. Désinstaller l'ancienne version si présente
2. Glisser-déposer `StudentFlow-FINAL.apk` dans BlueStacks
3. Attendre l'installation
4. Tester les nouvelles fonctionnalités

---

*Créé le 06/02/2026 - Workflow validé pour StudentFlow*
