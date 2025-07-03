module.exports = (req, res, next) => {
  // 从请求头获取语言偏好
  const lang = req.headers['accept-language'] || 
               req.query.lang || 
               req.body?.lang || 
               'zh';
  
  // 提取语言代码（例如从 'zh-CN' 提取 'zh'）
  const langCode = lang.split('-')[0].toLowerCase();
  
  // 设置语言
  const supportedLangs = ['zh', 'en', 'de'];
  const selectedLang = supportedLangs.includes(langCode) ? langCode : 'zh';
  
  req.setLocale(selectedLang);
  
  next();
};