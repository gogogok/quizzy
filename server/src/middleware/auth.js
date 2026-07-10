import jwt from 'jsonwebtoken';
export function auth(req,res,next){const token=req.headers.authorization?.replace(/^Bearer\s+/,'');if(!token)return res.status(401).json({message:'Требуется авторизация'});try{req.user=jwt.verify(token,process.env.JWT_SECRET);next()}catch{return res.status(401).json({message:'Недействительный токен'})}}
export function organizerOnly(req,res,next){if(req.user?.role!=='ORGANIZER')return res.status(403).json({message:'Доступ только для организатора'});next()}
