const i18n = require('i18n');
const path = require('path');

i18n.configure({
  locales: ['zh', 'en', 'de'],
  defaultLocale: 'zh',
  directory: path.join(__dirname, '../locales'),
  objectNotation: true,
  updateFiles: false,
  syncFiles: false,
  register: global
});

module.exports = i18n;