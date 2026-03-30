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
import { load } from 'cheerio';
import { normalizeUrl, requireAuth, sendJsonError, sendMethodNotAllowed } from './_lib.js';
var USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36';
function isGoogleFaviconUrl(value) {
    return /(^https?:\/\/)?(www\.)?(google\.com\/s2\/favicons|t0\.gstatic\.com\/faviconV2)/i.test(value);
}
function absoluteUrl(baseUrl, candidate) {
    if (!candidate) {
        return "".concat(baseUrl.origin, "/favicon.ico");
    }
    try {
        var resolved = new URL(candidate, baseUrl).toString();
        return isGoogleFaviconUrl(resolved) ? "".concat(baseUrl.origin, "/favicon.ico") : resolved;
    }
    catch (_a) {
        return "".concat(baseUrl.origin, "/favicon.ico");
    }
}
function hasHan(text) {
    return /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/.test(text);
}
function translateToChinese(text) {
    return __awaiter(this, void 0, void 0, function () {
        var value, response, data, translated, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    value = text.trim();
                    if (!value || hasHan(value))
                        return [2 /*return*/, value];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch("https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=zh-CN&dt=t&q=".concat(encodeURIComponent(value)), {
                            headers: {
                                'user-agent': USER_AGENT,
                                'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8'
                            }
                        })];
                case 2:
                    response = _b.sent();
                    if (!response.ok)
                        return [2 /*return*/, value];
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = (_b.sent());
                    if (!Array.isArray(data) || !Array.isArray(data[0]))
                        return [2 /*return*/, value];
                    translated = data[0]
                        .map(function (chunk) { return (Array.isArray(chunk) && typeof chunk[0] === 'string' ? chunk[0] : ''); })
                        .join('')
                        .trim();
                    return [2 /*return*/, translated || value];
                case 4:
                    _a = _b.sent();
                    return [2 /*return*/, value];
                case 5: return [2 /*return*/];
            }
        });
    });
}
export default function handler(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var url, targetUrl, controller, timeout, response, html, $, rawTitle, rawDescription, favicon, _a, title, description, error_1, message;
        var _b, _c, _d, _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    if (req.method !== 'POST') {
                        sendMethodNotAllowed(res, ['POST']);
                        return [2 /*return*/];
                    }
                    try {
                        requireAuth(req);
                    }
                    catch (error) {
                        sendJsonError(res, 401, error instanceof Error ? error.message : '未授权');
                        return [2 /*return*/];
                    }
                    url = typeof req.body === 'object' && req.body && 'url' in req.body ? req.body.url : null;
                    if (typeof url !== 'string' || !url.trim()) {
                        sendJsonError(res, 400, '请提供有效的 URL');
                        return [2 /*return*/];
                    }
                    targetUrl = normalizeUrl(url.trim());
                    controller = new AbortController();
                    timeout = setTimeout(function () { return controller.abort(); }, 8000);
                    _g.label = 1;
                case 1:
                    _g.trys.push([1, 5, 6, 7]);
                    return [4 /*yield*/, fetch(targetUrl.toString(), {
                            headers: {
                                'user-agent': USER_AGENT,
                                accept: 'text/html,application/xhtml+xml',
                                'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8'
                            },
                            signal: controller.signal
                        })];
                case 2:
                    response = _g.sent();
                    if (!response.ok) {
                        throw new Error("\u6293\u53D6\u5931\u8D25\uFF0C\u72B6\u6001\u7801 ".concat(response.status));
                    }
                    return [4 /*yield*/, response.text()];
                case 3:
                    html = _g.sent();
                    $ = load(html);
                    rawTitle = ((_b = $('meta[property="og:title"]').attr('content')) === null || _b === void 0 ? void 0 : _b.trim()) ||
                        ((_c = $('meta[name="twitter:title"]').attr('content')) === null || _c === void 0 ? void 0 : _c.trim()) ||
                        $('title').text().trim() ||
                        targetUrl.hostname;
                    rawDescription = ((_d = $('meta[property="og:description"]').attr('content')) === null || _d === void 0 ? void 0 : _d.trim()) ||
                        ((_e = $('meta[name="twitter:description"]').attr('content')) === null || _e === void 0 ? void 0 : _e.trim()) ||
                        ((_f = $('meta[name="description"]').attr('content')) === null || _f === void 0 ? void 0 : _f.trim()) ||
                        '';
                    favicon = $('link[rel="icon"]').attr('href') ||
                        $('link[rel="shortcut icon"]').attr('href') ||
                        $('link[rel="apple-touch-icon"]').attr('href') ||
                        null;
                    return [4 /*yield*/, Promise.all([
                            translateToChinese(rawTitle),
                            translateToChinese(rawDescription)
                        ])];
                case 4:
                    _a = _g.sent(), title = _a[0], description = _a[1];
                    res.status(200).json({
                        title: title,
                        description: description,
                        favicon: absoluteUrl(targetUrl, favicon)
                    });
                    return [3 /*break*/, 7];
                case 5:
                    error_1 = _g.sent();
                    message = error_1 instanceof Error && error_1.name === 'AbortError'
                        ? '抓取超时，请稍后重试'
                        : error_1 instanceof Error
                            ? error_1.message
                            : '抓取网站信息失败';
                    sendJsonError(res, 500, message);
                    return [3 /*break*/, 7];
                case 6:
                    clearTimeout(timeout);
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    });
}
