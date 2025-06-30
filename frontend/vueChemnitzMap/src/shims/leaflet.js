// 这里只处理裸导入，后续子模块由原包解析
import * as L from 'leaflet/dist/leaflet-src.esm.js';
export default L;
export * from 'leaflet/dist/leaflet-src.esm.js';
