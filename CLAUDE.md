# StudentFlow — Guide Claude

## Description

Application mobile PWA de gestion de vie étudiante — Capacitor/Ionic (Android + iOS).
Pas de backend, tout en localStorage.

## Stack technique

- **Frontend** : Vanilla JS + HTML/CSS (pas de framework)
- **Mobile** : Capacitor 6 (Android + iOS)
- **Libs** : Chart.js, Lucide, jsPDF, Confetti, Tailwind CSS (toutes dans `libs/`)
- **Build** : Capacitor → Android Studio → APK/AAB

## Lancer l'application

```bash
# Test navigateur direct
python -m http.server 8080
# Ouvrir http://localhost:8080

# Sync Capacitor (après modif web)
npx cap sync android

# Build APK via Android Studio
npx cap open android
# → Build → Generate Signed APK
```

## Structure

```
StudentFlow-/
├── index.html                    # Point d'entrée PWA
├── studentflow_ultimate_pro.html # App principale (~8500 lignes)
├── boutique.html                 # Page boutique
├── offline.html                  # Page hors-ligne
├── libs/                         # JS libs (Chart.js, Lucide, jsPDF, etc.)
├── js/                           # Modules JS (audio, config, storage)
├── icons/                        # Icônes PWA
├── android/                      # Projet Android (Capacitor)
├── ios/                          # Projet iOS (Capacitor)
├── www/                          # Assets web compilés (gitignored)
│   ├── studentflow_ultimate_pro.html
│   ├── *.min.js                  # Copies des libs (non trackées)
│   └── ...
└── docs/                         # Documentation
    ├── methode-apk.md            # Guide compilation APK
    └── security-audit.md         # Audit sécurité
```

## Workflow de mise à jour APK

1. Modifier les fichiers HTML/JS à la racine
2. Copier vers `www/` : `cp *.html www/ && cp libs/*.min.js www/`
3. Synchroniser Capacitor : `npx cap sync android`
4. Ouvrir Android Studio : `npx cap open android`
5. Build → Generate Signed Bundle/APK

## Notes importantes

- `www/` est dans `.gitignore` → ne pas commiter les assets compilés
- Les `.apk` et `.aab` sont dans `.gitignore` → utiliser les releases GitHub ou partage direct
- Pas de backend — toutes les données sont en localStorage
- L'app principale est `studentflow_ultimate_pro.html` (monolithique ~8500 lignes)

## Capacitor config

Voir `capacitor.config.json` pour les IDs d'app et la config des plugins.
