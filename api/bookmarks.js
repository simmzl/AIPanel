var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { feishuRequest, getFeishuConfig, normalizeUrl, requireAuth, sendJsonError, sendMethodNotAllowed } from './_lib.js';
var CATEGORY_PLACEHOLDER_TITLE = '—';
var CATEGORY_PLACEHOLDER_SUBTITLE = '—';
var CATEGORY_PLACEHOLDER_URL = 'https://placeholder.local';
function isGoogleFaviconUrl(value) {
    return /(^https?:\/\/)?(www\.)?(google\.com\/s2\/favicons|t0\.gstatic\.com\/faviconV2)/i.test(value);
}
function resolveFavicon(icon, url) {
    if (icon && icon.trim() && (icon.startsWith('http://') || icon.startsWith('https://')) && !isGoogleFaviconUrl(icon)) {
        return icon;
    }
    if (url) {
        try {
            var u = new URL(url);
            return "".concat(u.origin, "/favicon.ico");
        }
        catch (_a) {
            // fall through
        }
    }
    return '';
}
function transformRecord(record) {
    var _a, _b, _c;
    var url = ((_a = record.fields.链接) === null || _a === void 0 ? void 0 : _a.link) || '';
    return {
        id: record.record_id,
        title: record.fields.标题 || ((_b = record.fields.链接) === null || _b === void 0 ? void 0 : _b.text) || '未命名网站',
        subtitle: record.fields.副标题 || '',
        url: url,
        favicon: resolveFavicon(record.fields.图标, url),
        category: record.fields.分类 || '其他',
        order: Number(record.fields.排序 || 0),
        categoryOrder: Number((_c = record.fields.分类排序) !== null && _c !== void 0 ? _c : (Number(record.fields.排序 || 0) || 0))
    };
}
function parseBody(body) {
    var _a, _b, _c, _d;
    if (!body || typeof body !== 'object') {
        throw new Error('请求体格式错误');
    }
    var candidate = body;
    if (!candidate.url) {
        throw new Error('URL 为必填项');
    }
    var normalized = normalizeUrl(candidate.url);
    return {
        url: normalized.toString(),
        title: ((_a = candidate.title) === null || _a === void 0 ? void 0 : _a.trim()) || normalized.hostname,
        subtitle: ((_b = candidate.subtitle) === null || _b === void 0 ? void 0 : _b.trim()) || '',
        favicon: ((_c = candidate.favicon) === null || _c === void 0 ? void 0 : _c.trim()) || "".concat(normalized.origin, "/favicon.ico"),
        category: ((_d = candidate.category) === null || _d === void 0 ? void 0 : _d.trim()) || '其他',
        order: Number(candidate.order || 0)
    };
}
function parseCategoryOrderBody(body) {
    if (!body || typeof body !== 'object') {
        throw new Error('请求体格式错误');
    }
    var candidate = body;
    if (!Array.isArray(candidate.categories) || candidate.categories.length === 0) {
        throw new Error('分类排序不能为空');
    }
    var categories = candidate.categories
        .map(function (item) { return (typeof item === 'string' ? item.trim() : ''); })
        .filter(Boolean);
    if (categories.length === 0) {
        throw new Error('分类排序不能为空');
    }
    return categories;
}
function parseCategoryCreateBody(body) {
    var _a;
    if (!body || typeof body !== 'object') {
        throw new Error('请求体格式错误');
    }
    var candidate = body;
    var name = (_a = candidate.name) === null || _a === void 0 ? void 0 : _a.trim();
    if (!name) {
        throw new Error('分类名称不能为空');
    }
    return name;
}
function fetchAllRecords(basePath) {
    return __awaiter(this, void 0, void 0, function () {
        var allItems, pageToken, hasMore, params, data;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    allItems = [];
                    hasMore = true;
                    _e.label = 1;
                case 1:
                    if (!hasMore) return [3 /*break*/, 3];
                    params = new URLSearchParams({ page_size: '500' });
                    if (pageToken)
                        params.set('page_token', pageToken);
                    return [4 /*yield*/, feishuRequest("".concat(basePath, "?").concat(params.toString()))];
                case 2:
                    data = _e.sent();
                    if ((_a = data.data) === null || _a === void 0 ? void 0 : _a.items) {
                        allItems = allItems.concat(data.data.items);
                    }
                    hasMore = (_c = (_b = data.data) === null || _b === void 0 ? void 0 : _b.has_more) !== null && _c !== void 0 ? _c : false;
                    pageToken = (_d = data.data) === null || _d === void 0 ? void 0 : _d.page_token;
                    return [3 /*break*/, 1];
                case 3: return [2 /*return*/, allItems];
            }
        });
    });
}
export default function handler(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, appToken, tableId, basePath, allItems, bookmarks, categoryRank, _i, bookmarks_1, bm, categories, payload, data, recordId, payload, data, mode, name_1, fieldsPath, fieldList, categoryField, options, allItems_2, maxCategoryOrder, placeholder, categories, allItems, recordsByCategory_1, _b, allItems_1, item, category, list, records, recordId, error_1;
        var _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
        return __generator(this, function (_r) {
            switch (_r.label) {
                case 0:
                    try {
                        requireAuth(req);
                    }
                    catch (error) {
                        sendJsonError(res, 401, error instanceof Error ? error.message : '未授权');
                        return [2 /*return*/];
                    }
                    _a = getFeishuConfig(), appToken = _a.appToken, tableId = _a.tableId;
                    basePath = "/open-apis/bitable/v1/apps/".concat(appToken, "/tables/").concat(tableId, "/records");
                    _r.label = 1;
                case 1:
                    _r.trys.push([1, 19, , 20]);
                    if (!(req.method === 'GET')) return [3 /*break*/, 3];
                    return [4 /*yield*/, fetchAllRecords(basePath)];
                case 2:
                    allItems = _r.sent();
                    bookmarks = allItems
                        .map(transformRecord)
                        .sort(function (left, right) {
                        var _a, _b;
                        return ((_a = left.categoryOrder) !== null && _a !== void 0 ? _a : 0) - ((_b = right.categoryOrder) !== null && _b !== void 0 ? _b : 0) ||
                            left.category.localeCompare(right.category, 'zh-CN') ||
                            left.order - right.order ||
                            left.title.localeCompare(right.title, 'zh-CN');
                    });
                    categoryRank = new Map();
                    for (_i = 0, bookmarks_1 = bookmarks; _i < bookmarks_1.length; _i++) {
                        bm = bookmarks_1[_i];
                        if (!categoryRank.has(bm.category)) {
                            categoryRank.set(bm.category, (_d = (_c = bm.categoryOrder) !== null && _c !== void 0 ? _c : bm.order) !== null && _d !== void 0 ? _d : 0);
                        }
                        else {
                            categoryRank.set(bm.category, Math.min((_e = categoryRank.get(bm.category)) !== null && _e !== void 0 ? _e : 0, (_g = (_f = bm.categoryOrder) !== null && _f !== void 0 ? _f : bm.order) !== null && _g !== void 0 ? _g : 0));
                        }
                    }
                    categories = Array.from(categoryRank.entries())
                        .sort(function (left, right) { return left[1] - right[1] || left[0].localeCompare(right[0], 'zh-CN'); })
                        .map(function (_a) {
                        var name = _a[0];
                        return name;
                    });
                    res.status(200).json({ bookmarks: bookmarks, categories: categories });
                    return [2 /*return*/];
                case 3:
                    if (!(req.method === 'POST')) return [3 /*break*/, 5];
                    payload = parseBody(req.body);
                    return [4 /*yield*/, feishuRequest(basePath, {
                            method: 'POST',
                            body: JSON.stringify({
                                fields: {
                                    标题: payload.title,
                                    副标题: payload.subtitle,
                                    链接: {
                                        link: payload.url,
                                        text: payload.title
                                    },
                                    图标: payload.favicon,
                                    分类: payload.category,
                                    排序: payload.order
                                }
                            })
                        })];
                case 4:
                    data = _r.sent();
                    res.status(201).json({ bookmark: transformRecord((_h = data.data) === null || _h === void 0 ? void 0 : _h.record) });
                    return [2 /*return*/];
                case 5:
                    if (!(req.method === 'PUT')) return [3 /*break*/, 7];
                    recordId = req.query.id;
                    if (typeof recordId !== 'string' || !recordId) {
                        sendJsonError(res, 400, '缺少书签 ID');
                        return [2 /*return*/];
                    }
                    payload = parseBody(req.body);
                    return [4 /*yield*/, feishuRequest("".concat(basePath, "/").concat(recordId), {
                            method: 'PUT',
                            body: JSON.stringify({
                                fields: {
                                    标题: payload.title,
                                    副标题: payload.subtitle,
                                    链接: {
                                        link: payload.url,
                                        text: payload.title
                                    },
                                    图标: payload.favicon,
                                    分类: payload.category,
                                    排序: payload.order
                                }
                            })
                        })];
                case 6:
                    data = _r.sent();
                    res.status(200).json({ bookmark: transformRecord((_j = data.data) === null || _j === void 0 ? void 0 : _j.record) });
                    return [2 /*return*/];
                case 7:
                    if (!(req.method === 'PATCH')) return [3 /*break*/, 16];
                    mode = typeof req.query.mode === 'string' ? req.query.mode : undefined;
                    if (!(mode === 'category')) return [3 /*break*/, 12];
                    name_1 = parseCategoryCreateBody(req.body);
                    fieldsPath = "/open-apis/bitable/v1/apps/".concat(appToken, "/tables/").concat(tableId, "/fields");
                    return [4 /*yield*/, feishuRequest(fieldsPath)];
                case 8:
                    fieldList = _r.sent();
                    categoryField = (_l = (_k = fieldList.data) === null || _k === void 0 ? void 0 : _k.items) === null || _l === void 0 ? void 0 : _l.find(function (item) { return item.field_name === '分类'; });
                    if (!categoryField) {
                        sendJsonError(res, 400, '未找到分类字段');
                        return [2 /*return*/];
                    }
                    options = (_o = (_m = categoryField.property) === null || _m === void 0 ? void 0 : _m.options) !== null && _o !== void 0 ? _o : [];
                    if (options.some(function (option) { return option.name === name_1; })) {
                        res.status(200).json({ success: true, name: name_1 });
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, feishuRequest("".concat(fieldsPath, "/").concat(categoryField.field_id), {
                            method: 'PUT',
                            body: JSON.stringify({
                                field_name: '分类',
                                type: 3,
                                property: {
                                    options: __spreadArray(__spreadArray([], options.map(function (option) {
                                        var _a;
                                        return ({
                                            id: option.id,
                                            name: option.name,
                                            color: (_a = option.color) !== null && _a !== void 0 ? _a : 0
                                        });
                                    }), true), [
                                        {
                                            name: name_1,
                                            color: options.length % 54
                                        }
                                    ], false)
                                }
                            })
                        })];
                case 9:
                    _r.sent();
                    return [4 /*yield*/, fetchAllRecords(basePath)];
                case 10:
                    allItems_2 = _r.sent();
                    maxCategoryOrder = allItems_2.reduce(function (max, item) { return Math.max(max, Number(item.fields.分类排序 || 0)); }, 0);
                    return [4 /*yield*/, feishuRequest(basePath, {
                            method: 'POST',
                            body: JSON.stringify({
                                fields: {
                                    标题: CATEGORY_PLACEHOLDER_TITLE,
                                    副标题: CATEGORY_PLACEHOLDER_SUBTITLE,
                                    链接: {
                                        link: CATEGORY_PLACEHOLDER_URL,
                                        text: CATEGORY_PLACEHOLDER_TITLE
                                    },
                                    图标: '',
                                    分类: name_1,
                                    排序: 0,
                                    分类排序: maxCategoryOrder + 1
                                }
                            })
                        })];
                case 11:
                    placeholder = _r.sent();
                    res.status(200).json({ success: true, name: name_1, bookmark: transformRecord((_p = placeholder.data) === null || _p === void 0 ? void 0 : _p.record) });
                    return [2 /*return*/];
                case 12:
                    categories = parseCategoryOrderBody(req.body);
                    return [4 /*yield*/, fetchAllRecords(basePath)];
                case 13:
                    allItems = _r.sent();
                    recordsByCategory_1 = new Map();
                    for (_b = 0, allItems_1 = allItems; _b < allItems_1.length; _b++) {
                        item = allItems_1[_b];
                        category = item.fields.分类 || '其他';
                        list = (_q = recordsByCategory_1.get(category)) !== null && _q !== void 0 ? _q : [];
                        list.push(item.record_id);
                        recordsByCategory_1.set(category, list);
                    }
                    records = categories.flatMap(function (category, index) {
                        var _a;
                        return ((_a = recordsByCategory_1.get(category)) !== null && _a !== void 0 ? _a : []).map(function (recordId) { return ({
                            record_id: recordId,
                            fields: {
                                分类排序: index + 1
                            }
                        }); });
                    });
                    if (!(records.length > 0)) return [3 /*break*/, 15];
                    return [4 /*yield*/, feishuRequest("".concat(basePath, "/batch_update"), {
                            method: 'POST',
                            body: JSON.stringify({ records: records })
                        })];
                case 14:
                    _r.sent();
                    _r.label = 15;
                case 15:
                    res.status(200).json({ success: true });
                    return [2 /*return*/];
                case 16:
                    if (!(req.method === 'DELETE')) return [3 /*break*/, 18];
                    recordId = req.query.id;
                    if (typeof recordId !== 'string' || !recordId) {
                        sendJsonError(res, 400, '缺少书签 ID');
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, feishuRequest("".concat(basePath, "/").concat(recordId), {
                            method: 'DELETE'
                        })];
                case 17:
                    _r.sent();
                    res.status(200).json({ success: true });
                    return [2 /*return*/];
                case 18:
                    sendMethodNotAllowed(res, ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
                    return [3 /*break*/, 20];
                case 19:
                    error_1 = _r.sent();
                    sendJsonError(res, 500, error_1 instanceof Error ? error_1.message : '书签请求失败');
                    return [3 /*break*/, 20];
                case 20: return [2 /*return*/];
            }
        });
    });
}
