import { decodeToken } from "../utils/auth.utils.js";

export function authentificationMiddleware() {

    return async (req, res, next) => {

        //? Récuperation des données d'authentification
        const authData = req.headers['authorization'] ?? '';

        //? Extraction du token
        const [prefix, token] = authData.split(' ');

        //? Si aucune donnée valide -> Utilisateur non authentifier
        if (prefix?.toLowerCase() !== 'bearer' || !token) {
            req.user = null;
            next();
            return;
        }

        // Récuperation des données contenu dans le token
        try {
            //? Utilisteur authentifier !
            req.user = await decodeToken(token);
        }
        catch {
            //? Token invalide -> Utilisateur non authentifier
            req.user = null;
        }
        next();
    };
}

export function authorizeMiddleware(...roles) {

    return (req, res, next) => {

        // Vérification de si l'utilisateur est connecté
        if (!req.user) {
            res.sendStatus(401); //! -> Unauthorized
            return;
        }

        // S'il y a un role, vérification que l'utilisateur possede le role
        if(roles.length > 1 && !roles.includes(req.user.role)) {
            res.sendStatus(403); //! -> Forbidden
            return;
        }

        next();
    };
}