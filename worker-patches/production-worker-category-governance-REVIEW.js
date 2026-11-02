// STRICT D1 VERSIONED RELEASE REVIEW — NOT DEPLOYED. Requires bootstrap and cutover.
// PRODUCTION CATEGORY GOVERNANCE — REVIEW CANDIDATE; NOT DEPLOYED.
// Derived from user-confirmed active Production pending-only Worker.
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// pz-worker-v3.2.1-cors-review.js
var __create = Object.create;
var __defProp2 = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
var __commonJS = /* @__PURE__ */ __name((cb, mod) => /* @__PURE__ */ __name(function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
}, "__require"), "__commonJS");
var __copyProps = /* @__PURE__ */ __name((to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp2(to, key, { get: /* @__PURE__ */ __name(() => from[key], "get"), enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
}, "__copyProps");
var __toESM = /* @__PURE__ */ __name((mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp2(target, "default", { value: mod, enumerable: true }) : target,
  mod
)), "__toESM");
var require_crypto = __commonJS({
  "(disabled):crypto"() {
  }
});
var import_crypto = __toESM(require_crypto(), 1);
var randomFallback = null;
function randomBytes(len) {
  try {
    return crypto.getRandomValues(new Uint8Array(len));
  } catch {
  }
  try {
    return import_crypto.default.randomBytes(len);
  } catch {
  }
  if (!randomFallback) {
    throw Error(
      "Neither WebCryptoAPI nor a crypto module is available. Use bcrypt.setRandomFallback to set an alternative"
    );
  }
  return randomFallback(len);
}
__name(randomBytes, "randomBytes");
__name2(randomBytes, "randomBytes");
function genSaltSync(rounds, seed_length) {
  rounds = rounds || GENSALT_DEFAULT_LOG2_ROUNDS;
  if (typeof rounds !== "number")
    throw Error(
      "Illegal arguments: " + typeof rounds + ", " + typeof seed_length
    );
  if (rounds < 4) rounds = 4;
  else if (rounds > 31) rounds = 31;
  var salt = [];
  salt.push("$2b$");
  if (rounds < 10) salt.push("0");
  salt.push(rounds.toString());
  salt.push("$");
  salt.push(base64_encode(randomBytes(BCRYPT_SALT_LEN), BCRYPT_SALT_LEN));
  return salt.join("");
}
__name(genSaltSync, "genSaltSync");
__name2(genSaltSync, "genSaltSync");
function genSalt(rounds, seed_length, callback) {
  if (typeof seed_length === "function")
    callback = seed_length, seed_length = void 0;
  if (typeof rounds === "function") callback = rounds, rounds = void 0;
  if (typeof rounds === "undefined") rounds = GENSALT_DEFAULT_LOG2_ROUNDS;
  else if (typeof rounds !== "number")
    throw Error("illegal arguments: " + typeof rounds);
  function _async(callback2) {
    nextTick(function() {
      try {
        callback2(null, genSaltSync(rounds));
      } catch (err) {
        callback2(err);
      }
    });
  }
  __name(_async, "_async");
  __name2(_async, "_async");
  if (callback) {
    if (typeof callback !== "function")
      throw Error("Illegal callback: " + typeof callback);
    _async(callback);
  } else
    return new Promise(function(resolve, reject) {
      _async(function(err, res) {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
}
__name(genSalt, "genSalt");
__name2(genSalt, "genSalt");
function hash(password, salt, callback, progressCallback) {
  function _async(callback2) {
    if (typeof password === "string" && typeof salt === "number")
      genSalt(salt, function(err, salt2) {
        _hash(password, salt2, callback2, progressCallback);
      });
    else if (typeof password === "string" && typeof salt === "string")
      _hash(password, salt, callback2, progressCallback);
    else
      nextTick(
        callback2.bind(
          this,
          Error("Illegal arguments: " + typeof password + ", " + typeof salt)
        )
      );
  }
  __name(_async, "_async");
  __name2(_async, "_async");
  if (callback) {
    if (typeof callback !== "function")
      throw Error("Illegal callback: " + typeof callback);
    _async(callback);
  } else
    return new Promise(function(resolve, reject) {
      _async(function(err, res) {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
}
__name(hash, "hash");
__name2(hash, "hash");
function safeStringCompare(known, unknown) {
  var diff = known.length ^ unknown.length;
  for (var i = 0; i < known.length; ++i) {
    diff |= known.charCodeAt(i) ^ unknown.charCodeAt(i);
  }
  return diff === 0;
}
__name(safeStringCompare, "safeStringCompare");
__name2(safeStringCompare, "safeStringCompare");
function compare(password, hashValue, callback, progressCallback) {
  function _async(callback2) {
    if (typeof password !== "string" || typeof hashValue !== "string") {
      nextTick(
        callback2.bind(
          this,
          Error(
            "Illegal arguments: " + typeof password + ", " + typeof hashValue
          )
        )
      );
      return;
    }
    if (hashValue.length !== 60) {
      nextTick(callback2.bind(this, null, false));
      return;
    }
    hash(
      password,
      hashValue.substring(0, 29),
      function(err, comp) {
        if (err) callback2(err);
        else callback2(null, safeStringCompare(comp, hashValue));
      },
      progressCallback
    );
  }
  __name(_async, "_async");
  __name2(_async, "_async");
  if (callback) {
    if (typeof callback !== "function")
      throw Error("Illegal callback: " + typeof callback);
    _async(callback);
  } else
    return new Promise(function(resolve, reject) {
      _async(function(err, res) {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
}
__name(compare, "compare");
__name2(compare, "compare");
var nextTick = typeof setImmediate === "function" ? setImmediate : typeof scheduler === "object" && typeof scheduler.postTask === "function" ? scheduler.postTask.bind(scheduler) : setTimeout;
function utf8Length(string) {
  var len = 0, c = 0;
  for (var i = 0; i < string.length; ++i) {
    c = string.charCodeAt(i);
    if (c < 128) len += 1;
    else if (c < 2048) len += 2;
    else if ((c & 64512) === 55296 && (string.charCodeAt(i + 1) & 64512) === 56320) {
      ++i;
      len += 4;
    } else len += 3;
  }
  return len;
}
__name(utf8Length, "utf8Length");
__name2(utf8Length, "utf8Length");
function utf8Array(string) {
  var offset = 0, c1, c2;
  var buffer = new Array(utf8Length(string));
  for (var i = 0, k = string.length; i < k; ++i) {
    c1 = string.charCodeAt(i);
    if (c1 < 128) {
      buffer[offset++] = c1;
    } else if (c1 < 2048) {
      buffer[offset++] = c1 >> 6 | 192;
      buffer[offset++] = c1 & 63 | 128;
    } else if ((c1 & 64512) === 55296 && ((c2 = string.charCodeAt(i + 1)) & 64512) === 56320) {
      c1 = 65536 + ((c1 & 1023) << 10) + (c2 & 1023);
      ++i;
      buffer[offset++] = c1 >> 18 | 240;
      buffer[offset++] = c1 >> 12 & 63 | 128;
      buffer[offset++] = c1 >> 6 & 63 | 128;
      buffer[offset++] = c1 & 63 | 128;
    } else {
      buffer[offset++] = c1 >> 12 | 224;
      buffer[offset++] = c1 >> 6 & 63 | 128;
      buffer[offset++] = c1 & 63 | 128;
    }
  }
  return buffer;
}
__name(utf8Array, "utf8Array");
__name2(utf8Array, "utf8Array");
var BASE64_CODE = "./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split("");
var BASE64_INDEX = [
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  1,
  54,
  55,
  56,
  57,
  58,
  59,
  60,
  61,
  62,
  63,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19,
  20,
  21,
  22,
  23,
  24,
  25,
  26,
  27,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  28,
  29,
  30,
  31,
  32,
  33,
  34,
  35,
  36,
  37,
  38,
  39,
  40,
  41,
  42,
  43,
  44,
  45,
  46,
  47,
  48,
  49,
  50,
  51,
  52,
  53,
  -1,
  -1,
  -1,
  -1,
  -1
];
function base64_encode(b, len) {
  var off = 0, rs = [], c1, c2;
  if (len <= 0 || len > b.length) throw Error("Illegal len: " + len);
  while (off < len) {
    c1 = b[off++] & 255;
    rs.push(BASE64_CODE[c1 >> 2 & 63]);
    c1 = (c1 & 3) << 4;
    if (off >= len) {
      rs.push(BASE64_CODE[c1 & 63]);
      break;
    }
    c2 = b[off++] & 255;
    c1 |= c2 >> 4 & 15;
    rs.push(BASE64_CODE[c1 & 63]);
    c1 = (c2 & 15) << 2;
    if (off >= len) {
      rs.push(BASE64_CODE[c1 & 63]);
      break;
    }
    c2 = b[off++] & 255;
    c1 |= c2 >> 6 & 3;
    rs.push(BASE64_CODE[c1 & 63]);
    rs.push(BASE64_CODE[c2 & 63]);
  }
  return rs.join("");
}
__name(base64_encode, "base64_encode");
__name2(base64_encode, "base64_encode");
function base64_decode(s, len) {
  var off = 0, slen = s.length, olen = 0, rs = [], c1, c2, c3, c4, o, code;
  if (len <= 0) throw Error("Illegal len: " + len);
  while (off < slen - 1 && olen < len) {
    code = s.charCodeAt(off++);
    c1 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
    code = s.charCodeAt(off++);
    c2 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
    if (c1 == -1 || c2 == -1) break;
    o = c1 << 2 >>> 0;
    o |= (c2 & 48) >> 4;
    rs.push(String.fromCharCode(o));
    if (++olen >= len || off >= slen) break;
    code = s.charCodeAt(off++);
    c3 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
    if (c3 == -1) break;
    o = (c2 & 15) << 4 >>> 0;
    o |= (c3 & 60) >> 2;
    rs.push(String.fromCharCode(o));
    if (++olen >= len || off >= slen) break;
    code = s.charCodeAt(off++);
    c4 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
    o = (c3 & 3) << 6 >>> 0;
    o |= c4;
    rs.push(String.fromCharCode(o));
    ++olen;
  }
  var res = [];
  for (off = 0; off < olen; off++) res.push(rs[off].charCodeAt(0));
  return res;
}
__name(base64_decode, "base64_decode");
__name2(base64_decode, "base64_decode");
var BCRYPT_SALT_LEN = 16;
var GENSALT_DEFAULT_LOG2_ROUNDS = 10;
var BLOWFISH_NUM_ROUNDS = 16;
var MAX_EXECUTION_TIME = 100;
var P_ORIG = [
  608135816,
  2242054355,
  320440878,
  57701188,
  2752067618,
  698298832,
  137296536,
  3964562569,
  1160258022,
  953160567,
  3193202383,
  887688300,
  3232508343,
  3380367581,
  1065670069,
  3041331479,
  2450970073,
  2306472731
];
var S_ORIG = [
  3509652390,
  2564797868,
  805139163,
  3491422135,
  3101798381,
  1780907670,
  3128725573,
  4046225305,
  614570311,
  3012652279,
  134345442,
  2240740374,
  1667834072,
  1901547113,
  2757295779,
  4103290238,
  227898511,
  1921955416,
  1904987480,
  2182433518,
  2069144605,
  3260701109,
  2620446009,
  720527379,
  3318853667,
  677414384,
  3393288472,
  3101374703,
  2390351024,
  1614419982,
  1822297739,
  2954791486,
  3608508353,
  3174124327,
  2024746970,
  1432378464,
  3864339955,
  2857741204,
  1464375394,
  1676153920,
  1439316330,
  715854006,
  3033291828,
  289532110,
  2706671279,
  2087905683,
  3018724369,
  1668267050,
  732546397,
  1947742710,
  3462151702,
  2609353502,
  2950085171,
  1814351708,
  2050118529,
  680887927,
  999245976,
  1800124847,
  3300911131,
  1713906067,
  1641548236,
  4213287313,
  1216130144,
  1575780402,
  4018429277,
  3917837745,
  3693486850,
  3949271944,
  596196993,
  3549867205,
  258830323,
  2213823033,
  772490370,
  2760122372,
  1774776394,
  2652871518,
  566650946,
  4142492826,
  1728879713,
  2882767088,
  1783734482,
  3629395816,
  2517608232,
  2874225571,
  1861159788,
  326777828,
  3124490320,
  2130389656,
  2716951837,
  967770486,
  1724537150,
  2185432712,
  2364442137,
  1164943284,
  2105845187,
  998989502,
  3765401048,
  2244026483,
  1075463327,
  1455516326,
  1322494562,
  910128902,
  469688178,
  1117454909,
  936433444,
  3490320968,
  3675253459,
  1240580251,
  122909385,
  2157517691,
  634681816,
  4142456567,
  3825094682,
  3061402683,
  2540495037,
  79693498,
  3249098678,
  1084186820,
  1583128258,
  426386531,
  1761308591,
  1047286709,
  322548459,
  995290223,
  1845252383,
  2603652396,
  3431023940,
  2942221577,
  3202600964,
  3727903485,
  1712269319,
  422464435,
  3234572375,
  1170764815,
  3523960633,
  3117677531,
  1434042557,
  442511882,
  3600875718,
  1076654713,
  1738483198,
  4213154764,
  2393238008,
  3677496056,
  1014306527,
  4251020053,
  793779912,
  2902807211,
  842905082,
  4246964064,
  1395751752,
  1040244610,
  2656851899,
  3396308128,
  445077038,
  3742853595,
  3577915638,
  679411651,
  2892444358,
  2354009459,
  1767581616,
  3150600392,
  3791627101,
  3102740896,
  284835224,
  4246832056,
  1258075500,
  768725851,
  2589189241,
  3069724005,
  3532540348,
  1274779536,
  3789419226,
  2764799539,
  1660621633,
  3471099624,
  4011903706,
  913787905,
  3497959166,
  737222580,
  2514213453,
  2928710040,
  3937242737,
  1804850592,
  3499020752,
  2949064160,
  2386320175,
  2390070455,
  2415321851,
  4061277028,
  2290661394,
  2416832540,
  1336762016,
  1754252060,
  3520065937,
  3014181293,
  791618072,
  3188594551,
  3933548030,
  2332172193,
  3852520463,
  3043980520,
  413987798,
  3465142937,
  3030929376,
  4245938359,
  2093235073,
  3534596313,
  375366246,
  2157278981,
  2479649556,
  555357303,
  3870105701,
  2008414854,
  3344188149,
  4221384143,
  3956125452,
  2067696032,
  3594591187,
  2921233993,
  2428461,
  544322398,
  577241275,
  1471733935,
  610547355,
  4027169054,
  1432588573,
  1507829418,
  2025931657,
  3646575487,
  545086370,
  48609733,
  2200306550,
  1653985193,
  298326376,
  1316178497,
  3007786442,
  2064951626,
  458293330,
  2589141269,
  3591329599,
  3164325604,
  727753846,
  2179363840,
  146436021,
  1461446943,
  4069977195,
  705550613,
  3059967265,
  3887724982,
  4281599278,
  3313849956,
  1404054877,
  2845806497,
  146425753,
  1854211946,
  1266315497,
  3048417604,
  3681880366,
  3289982499,
  290971e4,
  1235738493,
  2632868024,
  2414719590,
  3970600049,
  1771706367,
  1449415276,
  3266420449,
  422970021,
  1963543593,
  2690192192,
  3826793022,
  1062508698,
  1531092325,
  1804592342,
  2583117782,
  2714934279,
  4024971509,
  1294809318,
  4028980673,
  1289560198,
  2221992742,
  1669523910,
  35572830,
  157838143,
  1052438473,
  1016535060,
  1802137761,
  1753167236,
  1386275462,
  3080475397,
  2857371447,
  1040679964,
  2145300060,
  2390574316,
  1461121720,
  2956646967,
  4031777805,
  4028374788,
  33600511,
  2920084762,
  1018524850,
  629373528,
  3691585981,
  3515945977,
  2091462646,
  2486323059,
  586499841,
  988145025,
  935516892,
  3367335476,
  2599673255,
  2839830854,
  265290510,
  3972581182,
  2759138881,
  3795373465,
  1005194799,
  847297441,
  406762289,
  1314163512,
  1332590856,
  1866599683,
  4127851711,
  750260880,
  613907577,
  1450815602,
  3165620655,
  3734664991,
  3650291728,
  3012275730,
  3704569646,
  1427272223,
  778793252,
  1343938022,
  2676280711,
  2052605720,
  1946737175,
  3164576444,
  3914038668,
  3967478842,
  3682934266,
  1661551462,
  3294938066,
  4011595847,
  840292616,
  3712170807,
  616741398,
  312560963,
  711312465,
  1351876610,
  322626781,
  1910503582,
  271666773,
  2175563734,
  1594956187,
  70604529,
  3617834859,
  1007753275,
  1495573769,
  4069517037,
  2549218298,
  2663038764,
  504708206,
  2263041392,
  3941167025,
  2249088522,
  1514023603,
  1998579484,
  1312622330,
  694541497,
  2582060303,
  2151582166,
  1382467621,
  776784248,
  2618340202,
  3323268794,
  2497899128,
  2784771155,
  503983604,
  4076293799,
  907881277,
  423175695,
  432175456,
  1378068232,
  4145222326,
  3954048622,
  3938656102,
  3820766613,
  2793130115,
  2977904593,
  26017576,
  3274890735,
  3194772133,
  1700274565,
  1756076034,
  4006520079,
  3677328699,
  720338349,
  1533947780,
  354530856,
  688349552,
  3973924725,
  1637815568,
  332179504,
  3949051286,
  53804574,
  2852348879,
  3044236432,
  1282449977,
  3583942155,
  3416972820,
  4006381244,
  1617046695,
  2628476075,
  3002303598,
  1686838959,
  431878346,
  2686675385,
  1700445008,
  1080580658,
  1009431731,
  832498133,
  3223435511,
  2605976345,
  2271191193,
  2516031870,
  1648197032,
  4164389018,
  2548247927,
  300782431,
  375919233,
  238389289,
  3353747414,
  2531188641,
  2019080857,
  1475708069,
  455242339,
  2609103871,
  448939670,
  3451063019,
  1395535956,
  2413381860,
  1841049896,
  1491858159,
  885456874,
  4264095073,
  4001119347,
  1565136089,
  3898914787,
  1108368660,
  540939232,
  1173283510,
  2745871338,
  3681308437,
  4207628240,
  3343053890,
  4016749493,
  1699691293,
  1103962373,
  3625875870,
  2256883143,
  3830138730,
  1031889488,
  3479347698,
  1535977030,
  4236805024,
  3251091107,
  2132092099,
  1774941330,
  1199868427,
  1452454533,
  157007616,
  2904115357,
  342012276,
  595725824,
  1480756522,
  206960106,
  497939518,
  591360097,
  863170706,
  2375253569,
  3596610801,
  1814182875,
  2094937945,
  3421402208,
  1082520231,
  3463918190,
  2785509508,
  435703966,
  3908032597,
  1641649973,
  2842273706,
  3305899714,
  1510255612,
  2148256476,
  2655287854,
  3276092548,
  4258621189,
  236887753,
  3681803219,
  274041037,
  1734335097,
  3815195456,
  3317970021,
  1899903192,
  1026095262,
  4050517792,
  356393447,
  2410691914,
  3873677099,
  3682840055,
  3913112168,
  2491498743,
  4132185628,
  2489919796,
  1091903735,
  1979897079,
  3170134830,
  3567386728,
  3557303409,
  857797738,
  1136121015,
  1342202287,
  507115054,
  2535736646,
  337727348,
  3213592640,
  1301675037,
  2528481711,
  1895095763,
  1721773893,
  3216771564,
  62756741,
  2142006736,
  835421444,
  2531993523,
  1442658625,
  3659876326,
  2882144922,
  676362277,
  1392781812,
  170690266,
  3921047035,
  1759253602,
  3611846912,
  1745797284,
  664899054,
  1329594018,
  3901205900,
  3045908486,
  2062866102,
  2865634940,
  3543621612,
  3464012697,
  1080764994,
  553557557,
  3656615353,
  3996768171,
  991055499,
  499776247,
  1265440854,
  648242737,
  3940784050,
  980351604,
  3713745714,
  1749149687,
  3396870395,
  4211799374,
  3640570775,
  1161844396,
  3125318951,
  1431517754,
  545492359,
  4268468663,
  3499529547,
  1437099964,
  2702547544,
  3433638243,
  2581715763,
  2787789398,
  1060185593,
  1593081372,
  2418618748,
  4260947970,
  69676912,
  2159744348,
  86519011,
  2512459080,
  3838209314,
  1220612927,
  3339683548,
  133810670,
  1090789135,
  1078426020,
  1569222167,
  845107691,
  3583754449,
  4072456591,
  1091646820,
  628848692,
  1613405280,
  3757631651,
  526609435,
  236106946,
  48312990,
  2942717905,
  3402727701,
  1797494240,
  859738849,
  992217954,
  4005476642,
  2243076622,
  3870952857,
  3732016268,
  765654824,
  3490871365,
  2511836413,
  1685915746,
  3888969200,
  1414112111,
  2273134842,
  3281911079,
  4080962846,
  172450625,
  2569994100,
  980381355,
  4109958455,
  2819808352,
  2716589560,
  2568741196,
  3681446669,
  3329971472,
  1835478071,
  660984891,
  3704678404,
  4045999559,
  3422617507,
  3040415634,
  1762651403,
  1719377915,
  3470491036,
  2693910283,
  3642056355,
  3138596744,
  1364962596,
  2073328063,
  1983633131,
  926494387,
  3423689081,
  2150032023,
  4096667949,
  1749200295,
  3328846651,
  309677260,
  2016342300,
  1779581495,
  3079819751,
  111262694,
  1274766160,
  443224088,
  298511866,
  1025883608,
  3806446537,
  1145181785,
  168956806,
  3641502830,
  3584813610,
  1689216846,
  3666258015,
  3200248200,
  1692713982,
  2646376535,
  4042768518,
  1618508792,
  1610833997,
  3523052358,
  4130873264,
  2001055236,
  3610705100,
  2202168115,
  4028541809,
  2961195399,
  1006657119,
  2006996926,
  3186142756,
  1430667929,
  3210227297,
  1314452623,
  4074634658,
  4101304120,
  2273951170,
  1399257539,
  3367210612,
  3027628629,
  1190975929,
  2062231137,
  2333990788,
  2221543033,
  2438960610,
  1181637006,
  548689776,
  2362791313,
  3372408396,
  3104550113,
  3145860560,
  296247880,
  1970579870,
  3078560182,
  3769228297,
  1714227617,
  3291629107,
  3898220290,
  166772364,
  1251581989,
  493813264,
  448347421,
  195405023,
  2709975567,
  677966185,
  3703036547,
  1463355134,
  2715995803,
  1338867538,
  1343315457,
  2802222074,
  2684532164,
  233230375,
  2599980071,
  2000651841,
  3277868038,
  1638401717,
  4028070440,
  3237316320,
  6314154,
  819756386,
  300326615,
  590932579,
  1405279636,
  3267499572,
  3150704214,
  2428286686,
  3959192993,
  3461946742,
  1862657033,
  1266418056,
  963775037,
  2089974820,
  2263052895,
  1917689273,
  448879540,
  3550394620,
  3981727096,
  150775221,
  3627908307,
  1303187396,
  508620638,
  2975983352,
  2726630617,
  1817252668,
  1876281319,
  1457606340,
  908771278,
  3720792119,
  3617206836,
  2455994898,
  1729034894,
  1080033504,
  976866871,
  3556439503,
  2881648439,
  1522871579,
  1555064734,
  1336096578,
  3548522304,
  2579274686,
  3574697629,
  3205460757,
  3593280638,
  3338716283,
  3079412587,
  564236357,
  2993598910,
  1781952180,
  1464380207,
  3163844217,
  3332601554,
  1699332808,
  1393555694,
  1183702653,
  3581086237,
  1288719814,
  691649499,
  2847557200,
  2895455976,
  3193889540,
  2717570544,
  1781354906,
  1676643554,
  2592534050,
  3230253752,
  1126444790,
  2770207658,
  2633158820,
  2210423226,
  2615765581,
  2414155088,
  3127139286,
  673620729,
  2805611233,
  1269405062,
  4015350505,
  3341807571,
  4149409754,
  1057255273,
  2012875353,
  2162469141,
  2276492801,
  2601117357,
  993977747,
  3918593370,
  2654263191,
  753973209,
  36408145,
  2530585658,
  25011837,
  3520020182,
  2088578344,
  530523599,
  2918365339,
  1524020338,
  1518925132,
  3760827505,
  3759777254,
  1202760957,
  3985898139,
  3906192525,
  674977740,
  4174734889,
  2031300136,
  2019492241,
  3983892565,
  4153806404,
  3822280332,
  352677332,
  2297720250,
  60907813,
  90501309,
  3286998549,
  1016092578,
  2535922412,
  2839152426,
  457141659,
  509813237,
  4120667899,
  652014361,
  1966332200,
  2975202805,
  55981186,
  2327461051,
  676427537,
  3255491064,
  2882294119,
  3433927263,
  1307055953,
  942726286,
  933058658,
  2468411793,
  3933900994,
  4215176142,
  1361170020,
  2001714738,
  2830558078,
  3274259782,
  1222529897,
  1679025792,
  2729314320,
  3714953764,
  1770335741,
  151462246,
  3013232138,
  1682292957,
  1483529935,
  471910574,
  1539241949,
  458788160,
  3436315007,
  1807016891,
  3718408830,
  978976581,
  1043663428,
  3165965781,
  1927990952,
  4200891579,
  2372276910,
  3208408903,
  3533431907,
  1412390302,
  2931980059,
  4132332400,
  1947078029,
  3881505623,
  4168226417,
  2941484381,
  1077988104,
  1320477388,
  886195818,
  18198404,
  3786409e3,
  2509781533,
  112762804,
  3463356488,
  1866414978,
  891333506,
  18488651,
  661792760,
  1628790961,
  3885187036,
  3141171499,
  876946877,
  2693282273,
  1372485963,
  791857591,
  2686433993,
  3759982718,
  3167212022,
  3472953795,
  2716379847,
  445679433,
  3561995674,
  3504004811,
  3574258232,
  54117162,
  3331405415,
  2381918588,
  3769707343,
  4154350007,
  1140177722,
  4074052095,
  668550556,
  3214352940,
  367459370,
  261225585,
  2610173221,
  4209349473,
  3468074219,
  3265815641,
  314222801,
  3066103646,
  3808782860,
  282218597,
  3406013506,
  3773591054,
  379116347,
  1285071038,
  846784868,
  2669647154,
  3771962079,
  3550491691,
  2305946142,
  453669953,
  1268987020,
  3317592352,
  3279303384,
  3744833421,
  2610507566,
  3859509063,
  266596637,
  3847019092,
  517658769,
  3462560207,
  3443424879,
  370717030,
  4247526661,
  2224018117,
  4143653529,
  4112773975,
  2788324899,
  2477274417,
  1456262402,
  2901442914,
  1517677493,
  1846949527,
  2295493580,
  3734397586,
  2176403920,
  1280348187,
  1908823572,
  3871786941,
  846861322,
  1172426758,
  3287448474,
  3383383037,
  1655181056,
  3139813346,
  901632758,
  1897031941,
  2986607138,
  3066810236,
  3447102507,
  1393639104,
  373351379,
  950779232,
  625454576,
  3124240540,
  4148612726,
  2007998917,
  544563296,
  2244738638,
  2330496472,
  2058025392,
  1291430526,
  424198748,
  50039436,
  29584100,
  3605783033,
  2429876329,
  2791104160,
  1057563949,
  3255363231,
  3075367218,
  3463963227,
  1469046755,
  985887462
];
var C_ORIG = [
  1332899944,
  1700884034,
  1701343084,
  1684370003,
  1668446532,
  1869963892
];
function _encipher(lr, off, P, S) {
  var n, l = lr[off], r = lr[off + 1];
  l ^= P[0];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[1];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[2];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[3];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[4];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[5];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[6];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[7];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[8];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[9];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[10];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[11];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[12];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[13];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[14];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[15];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[16];
  lr[off] = r ^ P[BLOWFISH_NUM_ROUNDS + 1];
  lr[off + 1] = l;
  return lr;
}
__name(_encipher, "_encipher");
__name2(_encipher, "_encipher");
function _streamtoword(data, offp) {
  for (var i = 0, word = 0; i < 4; ++i)
    word = word << 8 | data[offp] & 255, offp = (offp + 1) % data.length;
  return { key: word, offp };
}
__name(_streamtoword, "_streamtoword");
__name2(_streamtoword, "_streamtoword");
function _key(key, P, S) {
  var offset = 0, lr = [0, 0], plen = P.length, slen = S.length, sw;
  for (var i = 0; i < plen; i++)
    sw = _streamtoword(key, offset), offset = sw.offp, P[i] = P[i] ^ sw.key;
  for (i = 0; i < plen; i += 2)
    lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
  for (i = 0; i < slen; i += 2)
    lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
}
__name(_key, "_key");
__name2(_key, "_key");
function _ekskey(data, key, P, S) {
  var offp = 0, lr = [0, 0], plen = P.length, slen = S.length, sw;
  for (var i = 0; i < plen; i++)
    sw = _streamtoword(key, offp), offp = sw.offp, P[i] = P[i] ^ sw.key;
  offp = 0;
  for (i = 0; i < plen; i += 2)
    sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
  for (i = 0; i < slen; i += 2)
    sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
}
__name(_ekskey, "_ekskey");
__name2(_ekskey, "_ekskey");
function _crypt(b, salt, rounds, callback, progressCallback) {
  var cdata = C_ORIG.slice(), clen = cdata.length, err;
  if (rounds < 4 || rounds > 31) {
    err = Error("Illegal number of rounds (4-31): " + rounds);
    if (callback) {
      nextTick(callback.bind(this, err));
      return;
    } else throw err;
  }
  if (salt.length !== BCRYPT_SALT_LEN) {
    err = Error(
      "Illegal salt length: " + salt.length + " != " + BCRYPT_SALT_LEN
    );
    if (callback) {
      nextTick(callback.bind(this, err));
      return;
    } else throw err;
  }
  rounds = 1 << rounds >>> 0;
  var P, S, i = 0, j;
  if (typeof Int32Array === "function") {
    P = new Int32Array(P_ORIG);
    S = new Int32Array(S_ORIG);
  } else {
    P = P_ORIG.slice();
    S = S_ORIG.slice();
  }
  _ekskey(salt, b, P, S);
  function next() {
    if (progressCallback) progressCallback(i / rounds);
    if (i < rounds) {
      var start = Date.now();
      for (; i < rounds; ) {
        i = i + 1;
        _key(b, P, S);
        _key(salt, P, S);
        if (Date.now() - start > MAX_EXECUTION_TIME) break;
      }
    } else {
      for (i = 0; i < 64; i++)
        for (j = 0; j < clen >> 1; j++) _encipher(cdata, j << 1, P, S);
      var ret = [];
      for (i = 0; i < clen; i++)
        ret.push((cdata[i] >> 24 & 255) >>> 0), ret.push((cdata[i] >> 16 & 255) >>> 0), ret.push((cdata[i] >> 8 & 255) >>> 0), ret.push((cdata[i] & 255) >>> 0);
      if (callback) {
        callback(null, ret);
        return;
      } else return ret;
    }
    if (callback) nextTick(next);
  }
  __name(next, "next");
  __name2(next, "next");
  if (typeof callback !== "undefined") {
    next();
  } else {
    var res;
    while (true) if (typeof (res = next()) !== "undefined") return res || [];
  }
}
__name(_crypt, "_crypt");
__name2(_crypt, "_crypt");
function _hash(password, salt, callback, progressCallback) {
  var err;
  if (typeof password !== "string" || typeof salt !== "string") {
    err = Error("Invalid string / salt: Not a string");
    if (callback) {
      nextTick(callback.bind(this, err));
      return;
    } else throw err;
  }
  var minor, offset;
  if (salt.charAt(0) !== "$" || salt.charAt(1) !== "2") {
    err = Error("Invalid salt version: " + salt.substring(0, 2));
    if (callback) {
      nextTick(callback.bind(this, err));
      return;
    } else throw err;
  }
  if (salt.charAt(2) === "$") minor = String.fromCharCode(0), offset = 3;
  else {
    minor = salt.charAt(2);
    if (minor !== "a" && minor !== "b" && minor !== "y" || salt.charAt(3) !== "$") {
      err = Error("Invalid salt revision: " + salt.substring(2, 4));
      if (callback) {
        nextTick(callback.bind(this, err));
        return;
      } else throw err;
    }
    offset = 4;
  }
  if (salt.charAt(offset + 2) > "$") {
    err = Error("Missing salt rounds");
    if (callback) {
      nextTick(callback.bind(this, err));
      return;
    } else throw err;
  }
  var r1 = parseInt(salt.substring(offset, offset + 1), 10) * 10, r2 = parseInt(salt.substring(offset + 1, offset + 2), 10), rounds = r1 + r2, real_salt = salt.substring(offset + 3, offset + 25);
  password += minor >= "a" ? "\0" : "";
  var passwordb = utf8Array(password), saltb = base64_decode(real_salt, BCRYPT_SALT_LEN);
  function finish(bytes) {
    var res = [];
    res.push("$2");
    if (minor >= "a") res.push(minor);
    res.push("$");
    if (rounds < 10) res.push("0");
    res.push(rounds.toString());
    res.push("$");
    res.push(base64_encode(saltb, saltb.length));
    res.push(base64_encode(bytes, C_ORIG.length * 4 - 1));
    return res.join("");
  }
  __name(finish, "finish");
  __name2(finish, "finish");
  if (typeof callback == "undefined")
    return finish(_crypt(passwordb, saltb, rounds));
  else {
    _crypt(
      passwordb,
      saltb,
      rounds,
      function(err2, bytes) {
        if (err2) callback(err2, null);
        else callback(null, finish(bytes));
      },
      progressCallback
    );
  }
}
__name(_hash, "_hash");
__name2(_hash, "_hash");
var encoder = new TextEncoder();
var decoder = new TextDecoder();
var MAX_INT32 = 2 ** 32;
function concat(...buffers) {
  const size = buffers.reduce((acc, { length }) => acc + length, 0);
  const buf = new Uint8Array(size);
  let i = 0;
  for (const buffer of buffers) {
    buf.set(buffer, i);
    i += buffer.length;
  }
  return buf;
}
__name(concat, "concat");
__name2(concat, "concat");
function encode(string) {
  const bytes = new Uint8Array(string.length);
  for (let i = 0; i < string.length; i++) {
    const code = string.charCodeAt(i);
    if (code > 127) {
      throw new TypeError("non-ASCII string encountered in encode()");
    }
    bytes[i] = code;
  }
  return bytes;
}
__name(encode, "encode");
__name2(encode, "encode");
function encodeBase64(input) {
  if (Uint8Array.prototype.toBase64) {
    return input.toBase64();
  }
  const CHUNK_SIZE = 32768;
  const arr = [];
  for (let i = 0; i < input.length; i += CHUNK_SIZE) {
    arr.push(String.fromCharCode.apply(null, input.subarray(i, i + CHUNK_SIZE)));
  }
  return btoa(arr.join(""));
}
__name(encodeBase64, "encodeBase64");
__name2(encodeBase64, "encodeBase64");
function decodeBase64(encoded) {
  if (Uint8Array.fromBase64) {
    return Uint8Array.fromBase64(encoded);
  }
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
__name(decodeBase64, "decodeBase64");
__name2(decodeBase64, "decodeBase64");
function decode(input) {
  if (Uint8Array.fromBase64) {
    return Uint8Array.fromBase64(typeof input === "string" ? input : decoder.decode(input), {
      alphabet: "base64url"
    });
  }
  let encoded = input;
  if (encoded instanceof Uint8Array) {
    encoded = decoder.decode(encoded);
  }
  encoded = encoded.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return decodeBase64(encoded);
  } catch {
    throw new TypeError("The input to be decoded is not correctly encoded.");
  }
}
__name(decode, "decode");
__name2(decode, "decode");
function encode2(input) {
  let unencoded = input;
  if (typeof unencoded === "string") {
    unencoded = encoder.encode(unencoded);
  }
  if (Uint8Array.prototype.toBase64) {
    return unencoded.toBase64({ alphabet: "base64url", omitPadding: true });
  }
  return encodeBase64(unencoded).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
__name(encode2, "encode2");
__name2(encode2, "encode");
var JOSEError = class extends Error {
  static {
    __name(this, "JOSEError");
  }
  static {
    __name2(this, "JOSEError");
  }
  static code = "ERR_JOSE_GENERIC";
  code = "ERR_JOSE_GENERIC";
  constructor(message2, options) {
    super(message2, options);
    this.name = this.constructor.name;
    Error.captureStackTrace?.(this, this.constructor);
  }
};
var JWTClaimValidationFailed = class extends JOSEError {
  static {
    __name(this, "JWTClaimValidationFailed");
  }
  static {
    __name2(this, "JWTClaimValidationFailed");
  }
  static code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
  code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
  claim;
  reason;
  payload;
  constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
    super(message2, { cause: { claim, reason, payload } });
    this.claim = claim;
    this.reason = reason;
    this.payload = payload;
  }
};
var JWTExpired = class extends JOSEError {
  static {
    __name(this, "JWTExpired");
  }
  static {
    __name2(this, "JWTExpired");
  }
  static code = "ERR_JWT_EXPIRED";
  code = "ERR_JWT_EXPIRED";
  claim;
  reason;
  payload;
  constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
    super(message2, { cause: { claim, reason, payload } });
    this.claim = claim;
    this.reason = reason;
    this.payload = payload;
  }
};
var JOSEAlgNotAllowed = class extends JOSEError {
  static {
    __name(this, "JOSEAlgNotAllowed");
  }
  static {
    __name2(this, "JOSEAlgNotAllowed");
  }
  static code = "ERR_JOSE_ALG_NOT_ALLOWED";
  code = "ERR_JOSE_ALG_NOT_ALLOWED";
};
var JOSENotSupported = class extends JOSEError {
  static {
    __name(this, "JOSENotSupported");
  }
  static {
    __name2(this, "JOSENotSupported");
  }
  static code = "ERR_JOSE_NOT_SUPPORTED";
  code = "ERR_JOSE_NOT_SUPPORTED";
};
var JWSInvalid = class extends JOSEError {
  static {
    __name(this, "JWSInvalid");
  }
  static {
    __name2(this, "JWSInvalid");
  }
  static code = "ERR_JWS_INVALID";
  code = "ERR_JWS_INVALID";
};
var JWTInvalid = class extends JOSEError {
  static {
    __name(this, "JWTInvalid");
  }
  static {
    __name2(this, "JWTInvalid");
  }
  static code = "ERR_JWT_INVALID";
  code = "ERR_JWT_INVALID";
};
var JWSSignatureVerificationFailed = class extends JOSEError {
  static {
    __name(this, "JWSSignatureVerificationFailed");
  }
  static {
    __name2(this, "JWSSignatureVerificationFailed");
  }
  static code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
  code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
  constructor(message2 = "signature verification failed", options) {
    super(message2, options);
  }
};
var unusable = /* @__PURE__ */ __name2((name, prop = "algorithm.name") => new TypeError(`CryptoKey does not support this operation, its ${prop} must be ${name}`), "unusable");
var isAlgorithm = /* @__PURE__ */ __name2((algorithm, name) => algorithm.name === name, "isAlgorithm");
function getHashLength(hash2) {
  return parseInt(hash2.name.slice(4), 10);
}
__name(getHashLength, "getHashLength");
__name2(getHashLength, "getHashLength");
function getNamedCurve(alg) {
  switch (alg) {
    case "ES256":
      return "P-256";
    case "ES384":
      return "P-384";
    case "ES512":
      return "P-521";
    default:
      throw new Error("unreachable");
  }
}
__name(getNamedCurve, "getNamedCurve");
__name2(getNamedCurve, "getNamedCurve");
function checkUsage(key, usage) {
  if (usage && !key.usages.includes(usage)) {
    throw new TypeError(`CryptoKey does not support this operation, its usages must include ${usage}.`);
  }
}
__name(checkUsage, "checkUsage");
__name2(checkUsage, "checkUsage");
function checkSigCryptoKey(key, alg, usage) {
  switch (alg) {
    case "HS256":
    case "HS384":
    case "HS512": {
      if (!isAlgorithm(key.algorithm, "HMAC"))
        throw unusable("HMAC");
      const expected = parseInt(alg.slice(2), 10);
      const actual = getHashLength(key.algorithm.hash);
      if (actual !== expected)
        throw unusable(`SHA-${expected}`, "algorithm.hash");
      break;
    }
    case "RS256":
    case "RS384":
    case "RS512": {
      if (!isAlgorithm(key.algorithm, "RSASSA-PKCS1-v1_5"))
        throw unusable("RSASSA-PKCS1-v1_5");
      const expected = parseInt(alg.slice(2), 10);
      const actual = getHashLength(key.algorithm.hash);
      if (actual !== expected)
        throw unusable(`SHA-${expected}`, "algorithm.hash");
      break;
    }
    case "PS256":
    case "PS384":
    case "PS512": {
      if (!isAlgorithm(key.algorithm, "RSA-PSS"))
        throw unusable("RSA-PSS");
      const expected = parseInt(alg.slice(2), 10);
      const actual = getHashLength(key.algorithm.hash);
      if (actual !== expected)
        throw unusable(`SHA-${expected}`, "algorithm.hash");
      break;
    }
    case "Ed25519":
    case "EdDSA": {
      if (!isAlgorithm(key.algorithm, "Ed25519"))
        throw unusable("Ed25519");
      break;
    }
    case "ML-DSA-44":
    case "ML-DSA-65":
    case "ML-DSA-87": {
      if (!isAlgorithm(key.algorithm, alg))
        throw unusable(alg);
      break;
    }
    case "ES256":
    case "ES384":
    case "ES512": {
      if (!isAlgorithm(key.algorithm, "ECDSA"))
        throw unusable("ECDSA");
      const expected = getNamedCurve(alg);
      const actual = key.algorithm.namedCurve;
      if (actual !== expected)
        throw unusable(expected, "algorithm.namedCurve");
      break;
    }
    default:
      throw new TypeError("CryptoKey does not support this operation");
  }
  checkUsage(key, usage);
}
__name(checkSigCryptoKey, "checkSigCryptoKey");
__name2(checkSigCryptoKey, "checkSigCryptoKey");
function message(msg, actual, ...types) {
  types = types.filter(Boolean);
  if (types.length > 2) {
    const last = types.pop();
    msg += `one of type ${types.join(", ")}, or ${last}.`;
  } else if (types.length === 2) {
    msg += `one of type ${types[0]} or ${types[1]}.`;
  } else {
    msg += `of type ${types[0]}.`;
  }
  if (actual == null) {
    msg += ` Received ${actual}`;
  } else if (typeof actual === "function" && actual.name) {
    msg += ` Received function ${actual.name}`;
  } else if (typeof actual === "object" && actual != null) {
    if (actual.constructor?.name) {
      msg += ` Received an instance of ${actual.constructor.name}`;
    }
  }
  return msg;
}
__name(message, "message");
__name2(message, "message");
var invalidKeyInput = /* @__PURE__ */ __name2((actual, ...types) => message("Key must be ", actual, ...types), "invalidKeyInput");
var withAlg = /* @__PURE__ */ __name2((alg, actual, ...types) => message(`Key for the ${alg} algorithm must be `, actual, ...types), "withAlg");
var isCryptoKey = /* @__PURE__ */ __name2((key) => {
  if (key?.[Symbol.toStringTag] === "CryptoKey")
    return true;
  try {
    return key instanceof CryptoKey;
  } catch {
    return false;
  }
}, "isCryptoKey");
var isKeyObject = /* @__PURE__ */ __name2((key) => key?.[Symbol.toStringTag] === "KeyObject", "isKeyObject");
var isKeyLike = /* @__PURE__ */ __name2((key) => isCryptoKey(key) || isKeyObject(key), "isKeyLike");
function isDisjoint(...headers) {
  const sources = headers.filter(Boolean);
  if (sources.length === 0 || sources.length === 1) {
    return true;
  }
  let acc;
  for (const header of sources) {
    const parameters = Object.keys(header);
    if (!acc || acc.size === 0) {
      acc = new Set(parameters);
      continue;
    }
    for (const parameter of parameters) {
      if (acc.has(parameter)) {
        return false;
      }
      acc.add(parameter);
    }
  }
  return true;
}
__name(isDisjoint, "isDisjoint");
__name2(isDisjoint, "isDisjoint");
var isObjectLike = /* @__PURE__ */ __name2((value) => typeof value === "object" && value !== null, "isObjectLike");
function isObject(input) {
  if (!isObjectLike(input) || Object.prototype.toString.call(input) !== "[object Object]") {
    return false;
  }
  if (Object.getPrototypeOf(input) === null) {
    return true;
  }
  let proto = input;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }
  return Object.getPrototypeOf(input) === proto;
}
__name(isObject, "isObject");
__name2(isObject, "isObject");
function checkKeyLength(alg, key) {
  if (alg.startsWith("RS") || alg.startsWith("PS")) {
    const { modulusLength } = key.algorithm;
    if (typeof modulusLength !== "number" || modulusLength < 2048) {
      throw new TypeError(`${alg} requires key modulusLength to be 2048 bits or larger`);
    }
  }
}
__name(checkKeyLength, "checkKeyLength");
__name2(checkKeyLength, "checkKeyLength");
function subtleMapping(jwk) {
  let algorithm;
  let keyUsages;
  switch (jwk.kty) {
    case "AKP": {
      switch (jwk.alg) {
        case "ML-DSA-44":
        case "ML-DSA-65":
        case "ML-DSA-87":
          algorithm = { name: jwk.alg };
          keyUsages = jwk.priv ? ["sign"] : ["verify"];
          break;
        default:
          throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
      }
      break;
    }
    case "RSA": {
      switch (jwk.alg) {
        case "PS256":
        case "PS384":
        case "PS512":
          algorithm = { name: "RSA-PSS", hash: `SHA-${jwk.alg.slice(-3)}` };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "RS256":
        case "RS384":
        case "RS512":
          algorithm = { name: "RSASSA-PKCS1-v1_5", hash: `SHA-${jwk.alg.slice(-3)}` };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "RSA-OAEP":
        case "RSA-OAEP-256":
        case "RSA-OAEP-384":
        case "RSA-OAEP-512":
          algorithm = {
            name: "RSA-OAEP",
            hash: `SHA-${parseInt(jwk.alg.slice(-3), 10) || 1}`
          };
          keyUsages = jwk.d ? ["decrypt", "unwrapKey"] : ["encrypt", "wrapKey"];
          break;
        default:
          throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
      }
      break;
    }
    case "EC": {
      switch (jwk.alg) {
        case "ES256":
          algorithm = { name: "ECDSA", namedCurve: "P-256" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ES384":
          algorithm = { name: "ECDSA", namedCurve: "P-384" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ES512":
          algorithm = { name: "ECDSA", namedCurve: "P-521" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ECDH-ES":
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW":
          algorithm = { name: "ECDH", namedCurve: jwk.crv };
          keyUsages = jwk.d ? ["deriveBits"] : [];
          break;
        default:
          throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
      }
      break;
    }
    case "OKP": {
      switch (jwk.alg) {
        case "Ed25519":
        case "EdDSA":
          algorithm = { name: "Ed25519" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ECDH-ES":
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW":
          algorithm = { name: jwk.crv };
          keyUsages = jwk.d ? ["deriveBits"] : [];
          break;
        default:
          throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
      }
      break;
    }
    default:
      throw new JOSENotSupported('Invalid or unsupported JWK "kty" (Key Type) Parameter value');
  }
  return { algorithm, keyUsages };
}
__name(subtleMapping, "subtleMapping");
__name2(subtleMapping, "subtleMapping");
async function jwkToKey(jwk) {
  if (!jwk.alg) {
    throw new TypeError('"alg" argument is required when "jwk.alg" is not present');
  }
  const { algorithm, keyUsages } = subtleMapping(jwk);
  const keyData = { ...jwk };
  if (keyData.kty !== "AKP") {
    delete keyData.alg;
  }
  delete keyData.use;
  return crypto.subtle.importKey("jwk", keyData, algorithm, jwk.ext ?? (jwk.d || jwk.priv ? false : true), jwk.key_ops ?? keyUsages);
}
__name(jwkToKey, "jwkToKey");
__name2(jwkToKey, "jwkToKey");
function validateCrit(Err, recognizedDefault, recognizedOption, protectedHeader, joseHeader) {
  if (joseHeader.crit !== void 0 && protectedHeader?.crit === void 0) {
    throw new Err('"crit" (Critical) Header Parameter MUST be integrity protected');
  }
  if (!protectedHeader || protectedHeader.crit === void 0) {
    return /* @__PURE__ */ new Set();
  }
  if (!Array.isArray(protectedHeader.crit) || protectedHeader.crit.length === 0 || protectedHeader.crit.some((input) => typeof input !== "string" || input.length === 0)) {
    throw new Err('"crit" (Critical) Header Parameter MUST be an array of non-empty strings when present');
  }
  let recognized;
  if (recognizedOption !== void 0) {
    recognized = new Map([...Object.entries(recognizedOption), ...recognizedDefault.entries()]);
  } else {
    recognized = recognizedDefault;
  }
  for (const parameter of protectedHeader.crit) {
    if (!recognized.has(parameter)) {
      throw new JOSENotSupported(`Extension Header Parameter "${parameter}" is not recognized`);
    }
    if (joseHeader[parameter] === void 0) {
      throw new Err(`Extension Header Parameter "${parameter}" is missing`);
    }
    if (recognized.get(parameter) && protectedHeader[parameter] === void 0) {
      throw new Err(`Extension Header Parameter "${parameter}" MUST be integrity protected`);
    }
  }
  return new Set(protectedHeader.crit);
}
__name(validateCrit, "validateCrit");
__name2(validateCrit, "validateCrit");
function validateAlgorithms(option, algorithms) {
  if (algorithms !== void 0 && (!Array.isArray(algorithms) || algorithms.some((s) => typeof s !== "string"))) {
    throw new TypeError(`"${option}" option must be an array of strings`);
  }
  if (!algorithms) {
    return void 0;
  }
  return new Set(algorithms);
}
__name(validateAlgorithms, "validateAlgorithms");
__name2(validateAlgorithms, "validateAlgorithms");
var isJWK = /* @__PURE__ */ __name2((key) => isObject(key) && typeof key.kty === "string", "isJWK");
var isPrivateJWK = /* @__PURE__ */ __name2((key) => key.kty !== "oct" && (key.kty === "AKP" && typeof key.priv === "string" || typeof key.d === "string"), "isPrivateJWK");
var isPublicJWK = /* @__PURE__ */ __name2((key) => key.kty !== "oct" && key.d === void 0 && key.priv === void 0, "isPublicJWK");
var isSecretJWK = /* @__PURE__ */ __name2((key) => key.kty === "oct" && typeof key.k === "string", "isSecretJWK");
var cache;
var handleJWK = /* @__PURE__ */ __name2(async (key, jwk, alg, freeze = false) => {
  cache ||= /* @__PURE__ */ new WeakMap();
  let cached = cache.get(key);
  if (cached?.[alg]) {
    return cached[alg];
  }
  const cryptoKey = await jwkToKey({ ...jwk, alg });
  if (freeze)
    Object.freeze(key);
  if (!cached) {
    cache.set(key, { [alg]: cryptoKey });
  } else {
    cached[alg] = cryptoKey;
  }
  return cryptoKey;
}, "handleJWK");
var handleKeyObject = /* @__PURE__ */ __name2((keyObject, alg) => {
  cache ||= /* @__PURE__ */ new WeakMap();
  let cached = cache.get(keyObject);
  if (cached?.[alg]) {
    return cached[alg];
  }
  const isPublic = keyObject.type === "public";
  const extractable = isPublic ? true : false;
  let cryptoKey;
  if (keyObject.asymmetricKeyType === "x25519") {
    switch (alg) {
      case "ECDH-ES":
      case "ECDH-ES+A128KW":
      case "ECDH-ES+A192KW":
      case "ECDH-ES+A256KW":
        break;
      default:
        throw new TypeError("given KeyObject instance cannot be used for this algorithm");
    }
    cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, isPublic ? [] : ["deriveBits"]);
  }
  if (keyObject.asymmetricKeyType === "ed25519") {
    if (alg !== "EdDSA" && alg !== "Ed25519") {
      throw new TypeError("given KeyObject instance cannot be used for this algorithm");
    }
    cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, [
      isPublic ? "verify" : "sign"
    ]);
  }
  switch (keyObject.asymmetricKeyType) {
    case "ml-dsa-44":
    case "ml-dsa-65":
    case "ml-dsa-87": {
      if (alg !== keyObject.asymmetricKeyType.toUpperCase()) {
        throw new TypeError("given KeyObject instance cannot be used for this algorithm");
      }
      cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, [
        isPublic ? "verify" : "sign"
      ]);
    }
  }
  if (keyObject.asymmetricKeyType === "rsa") {
    let hash2;
    switch (alg) {
      case "RSA-OAEP":
        hash2 = "SHA-1";
        break;
      case "RS256":
      case "PS256":
      case "RSA-OAEP-256":
        hash2 = "SHA-256";
        break;
      case "RS384":
      case "PS384":
      case "RSA-OAEP-384":
        hash2 = "SHA-384";
        break;
      case "RS512":
      case "PS512":
      case "RSA-OAEP-512":
        hash2 = "SHA-512";
        break;
      default:
        throw new TypeError("given KeyObject instance cannot be used for this algorithm");
    }
    if (alg.startsWith("RSA-OAEP")) {
      return keyObject.toCryptoKey({
        name: "RSA-OAEP",
        hash: hash2
      }, extractable, isPublic ? ["encrypt"] : ["decrypt"]);
    }
    cryptoKey = keyObject.toCryptoKey({
      name: alg.startsWith("PS") ? "RSA-PSS" : "RSASSA-PKCS1-v1_5",
      hash: hash2
    }, extractable, [isPublic ? "verify" : "sign"]);
  }
  if (keyObject.asymmetricKeyType === "ec") {
    const nist = /* @__PURE__ */ new Map([
      ["prime256v1", "P-256"],
      ["secp384r1", "P-384"],
      ["secp521r1", "P-521"]
    ]);
    const namedCurve = nist.get(keyObject.asymmetricKeyDetails?.namedCurve);
    if (!namedCurve) {
      throw new TypeError("given KeyObject instance cannot be used for this algorithm");
    }
    if (alg === "ES256" && namedCurve === "P-256") {
      cryptoKey = keyObject.toCryptoKey({
        name: "ECDSA",
        namedCurve
      }, extractable, [isPublic ? "verify" : "sign"]);
    }
    if (alg === "ES384" && namedCurve === "P-384") {
      cryptoKey = keyObject.toCryptoKey({
        name: "ECDSA",
        namedCurve
      }, extractable, [isPublic ? "verify" : "sign"]);
    }
    if (alg === "ES512" && namedCurve === "P-521") {
      cryptoKey = keyObject.toCryptoKey({
        name: "ECDSA",
        namedCurve
      }, extractable, [isPublic ? "verify" : "sign"]);
    }
    if (alg.startsWith("ECDH-ES")) {
      cryptoKey = keyObject.toCryptoKey({
        name: "ECDH",
        namedCurve
      }, extractable, isPublic ? [] : ["deriveBits"]);
    }
  }
  if (!cryptoKey) {
    throw new TypeError("given KeyObject instance cannot be used for this algorithm");
  }
  if (!cached) {
    cache.set(keyObject, { [alg]: cryptoKey });
  } else {
    cached[alg] = cryptoKey;
  }
  return cryptoKey;
}, "handleKeyObject");
async function normalizeKey(key, alg) {
  if (key instanceof Uint8Array) {
    return key;
  }
  if (isCryptoKey(key)) {
    return key;
  }
  if (isKeyObject(key)) {
    if (key.type === "secret") {
      return key.export();
    }
    if ("toCryptoKey" in key && typeof key.toCryptoKey === "function") {
      try {
        return handleKeyObject(key, alg);
      } catch (err) {
        if (err instanceof TypeError) {
          throw err;
        }
      }
    }
    let jwk = key.export({ format: "jwk" });
    return handleJWK(key, jwk, alg);
  }
  if (isJWK(key)) {
    if (key.k) {
      return decode(key.k);
    }
    return handleJWK(key, key, alg, true);
  }
  throw new Error("unreachable");
}
__name(normalizeKey, "normalizeKey");
__name2(normalizeKey, "normalizeKey");
var tag = /* @__PURE__ */ __name2((key) => key?.[Symbol.toStringTag], "tag");
var jwkMatchesOp = /* @__PURE__ */ __name2((alg, key, usage) => {
  if (key.use !== void 0) {
    let expected;
    switch (usage) {
      case "sign":
      case "verify":
        expected = "sig";
        break;
      case "encrypt":
      case "decrypt":
        expected = "enc";
        break;
    }
    if (key.use !== expected) {
      throw new TypeError(`Invalid key for this operation, its "use" must be "${expected}" when present`);
    }
  }
  if (key.alg !== void 0 && key.alg !== alg) {
    throw new TypeError(`Invalid key for this operation, its "alg" must be "${alg}" when present`);
  }
  if (Array.isArray(key.key_ops)) {
    let expectedKeyOp;
    switch (true) {
      case (usage === "sign" || usage === "verify"):
      case alg === "dir":
      case alg.includes("CBC-HS"):
        expectedKeyOp = usage;
        break;
      case alg.startsWith("PBES2"):
        expectedKeyOp = "deriveBits";
        break;
      case /^A\d{3}(?:GCM)?(?:KW)?$/.test(alg):
        if (!alg.includes("GCM") && alg.endsWith("KW")) {
          expectedKeyOp = usage === "encrypt" ? "wrapKey" : "unwrapKey";
        } else {
          expectedKeyOp = usage;
        }
        break;
      case (usage === "encrypt" && alg.startsWith("RSA")):
        expectedKeyOp = "wrapKey";
        break;
      case usage === "decrypt":
        expectedKeyOp = alg.startsWith("RSA") ? "unwrapKey" : "deriveBits";
        break;
    }
    if (expectedKeyOp && key.key_ops?.includes?.(expectedKeyOp) === false) {
      throw new TypeError(`Invalid key for this operation, its "key_ops" must include "${expectedKeyOp}" when present`);
    }
  }
  return true;
}, "jwkMatchesOp");
var symmetricTypeCheck = /* @__PURE__ */ __name2((alg, key, usage) => {
  if (key instanceof Uint8Array)
    return;
  if (isJWK(key)) {
    if (isSecretJWK(key) && jwkMatchesOp(alg, key, usage))
      return;
    throw new TypeError(`JSON Web Key for symmetric algorithms must have JWK "kty" (Key Type) equal to "oct" and the JWK "k" (Key Value) present`);
  }
  if (!isKeyLike(key)) {
    throw new TypeError(withAlg(alg, key, "CryptoKey", "KeyObject", "JSON Web Key", "Uint8Array"));
  }
  if (key.type !== "secret") {
    throw new TypeError(`${tag(key)} instances for symmetric algorithms must be of type "secret"`);
  }
}, "symmetricTypeCheck");
var asymmetricTypeCheck = /* @__PURE__ */ __name2((alg, key, usage) => {
  if (isJWK(key)) {
    switch (usage) {
      case "decrypt":
      case "sign":
        if (isPrivateJWK(key) && jwkMatchesOp(alg, key, usage))
          return;
        throw new TypeError(`JSON Web Key for this operation must be a private JWK`);
      case "encrypt":
      case "verify":
        if (isPublicJWK(key) && jwkMatchesOp(alg, key, usage))
          return;
        throw new TypeError(`JSON Web Key for this operation must be a public JWK`);
    }
  }
  if (!isKeyLike(key)) {
    throw new TypeError(withAlg(alg, key, "CryptoKey", "KeyObject", "JSON Web Key"));
  }
  if (key.type === "secret") {
    throw new TypeError(`${tag(key)} instances for asymmetric algorithms must not be of type "secret"`);
  }
  if (key.type === "public") {
    switch (usage) {
      case "sign":
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm signing must be of type "private"`);
      case "decrypt":
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm decryption must be of type "private"`);
    }
  }
  if (key.type === "private") {
    switch (usage) {
      case "verify":
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm verifying must be of type "public"`);
      case "encrypt":
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm encryption must be of type "public"`);
    }
  }
}, "asymmetricTypeCheck");
function checkKeyType(alg, key, usage) {
  switch (alg.substring(0, 2)) {
    case "A1":
    case "A2":
    case "di":
    case "HS":
    case "PB":
      symmetricTypeCheck(alg, key, usage);
      break;
    default:
      asymmetricTypeCheck(alg, key, usage);
  }
}
__name(checkKeyType, "checkKeyType");
__name2(checkKeyType, "checkKeyType");
function subtleAlgorithm(alg, algorithm) {
  const hash2 = `SHA-${alg.slice(-3)}`;
  switch (alg) {
    case "HS256":
    case "HS384":
    case "HS512":
      return { hash: hash2, name: "HMAC" };
    case "PS256":
    case "PS384":
    case "PS512":
      return { hash: hash2, name: "RSA-PSS", saltLength: parseInt(alg.slice(-3), 10) >> 3 };
    case "RS256":
    case "RS384":
    case "RS512":
      return { hash: hash2, name: "RSASSA-PKCS1-v1_5" };
    case "ES256":
    case "ES384":
    case "ES512":
      return { hash: hash2, name: "ECDSA", namedCurve: algorithm.namedCurve };
    case "Ed25519":
    case "EdDSA":
      return { name: "Ed25519" };
    case "ML-DSA-44":
    case "ML-DSA-65":
    case "ML-DSA-87":
      return { name: alg };
    default:
      throw new JOSENotSupported(`alg ${alg} is not supported either by JOSE or your javascript runtime`);
  }
}
__name(subtleAlgorithm, "subtleAlgorithm");
__name2(subtleAlgorithm, "subtleAlgorithm");
async function getSigKey(alg, key, usage) {
  if (key instanceof Uint8Array) {
    if (!alg.startsWith("HS")) {
      throw new TypeError(invalidKeyInput(key, "CryptoKey", "KeyObject", "JSON Web Key"));
    }
    return crypto.subtle.importKey("raw", key, { hash: `SHA-${alg.slice(-3)}`, name: "HMAC" }, false, [usage]);
  }
  checkSigCryptoKey(key, alg, usage);
  return key;
}
__name(getSigKey, "getSigKey");
__name2(getSigKey, "getSigKey");
async function verify(alg, key, signature, data) {
  const cryptoKey = await getSigKey(alg, key, "verify");
  checkKeyLength(alg, cryptoKey);
  const algorithm = subtleAlgorithm(alg, cryptoKey.algorithm);
  try {
    return await crypto.subtle.verify(algorithm, cryptoKey, signature, data);
  } catch {
    return false;
  }
}
__name(verify, "verify");
__name2(verify, "verify");
async function flattenedVerify(jws, key, options) {
  if (!isObject(jws)) {
    throw new JWSInvalid("Flattened JWS must be an object");
  }
  if (jws.protected === void 0 && jws.header === void 0) {
    throw new JWSInvalid('Flattened JWS must have either of the "protected" or "header" members');
  }
  if (jws.protected !== void 0 && typeof jws.protected !== "string") {
    throw new JWSInvalid("JWS Protected Header incorrect type");
  }
  if (jws.payload === void 0) {
    throw new JWSInvalid("JWS Payload missing");
  }
  if (typeof jws.signature !== "string") {
    throw new JWSInvalid("JWS Signature missing or incorrect type");
  }
  if (jws.header !== void 0 && !isObject(jws.header)) {
    throw new JWSInvalid("JWS Unprotected Header incorrect type");
  }
  let parsedProt = {};
  if (jws.protected) {
    try {
      const protectedHeader = decode(jws.protected);
      parsedProt = JSON.parse(decoder.decode(protectedHeader));
    } catch {
      throw new JWSInvalid("JWS Protected Header is invalid");
    }
  }
  if (!isDisjoint(parsedProt, jws.header)) {
    throw new JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
  }
  const joseHeader = {
    ...parsedProt,
    ...jws.header
  };
  const extensions = validateCrit(JWSInvalid, /* @__PURE__ */ new Map([["b64", true]]), options?.crit, parsedProt, joseHeader);
  let b64 = true;
  if (extensions.has("b64")) {
    b64 = parsedProt.b64;
    if (typeof b64 !== "boolean") {
      throw new JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
    }
  }
  const { alg } = joseHeader;
  if (typeof alg !== "string" || !alg) {
    throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
  }
  const algorithms = options && validateAlgorithms("algorithms", options.algorithms);
  if (algorithms && !algorithms.has(alg)) {
    throw new JOSEAlgNotAllowed('"alg" (Algorithm) Header Parameter value not allowed');
  }
  if (b64) {
    if (typeof jws.payload !== "string") {
      throw new JWSInvalid("JWS Payload must be a string");
    }
  } else if (typeof jws.payload !== "string" && !(jws.payload instanceof Uint8Array)) {
    throw new JWSInvalid("JWS Payload must be a string or an Uint8Array instance");
  }
  let resolvedKey = false;
  if (typeof key === "function") {
    key = await key(parsedProt, jws);
    resolvedKey = true;
  }
  checkKeyType(alg, key, "verify");
  const data = concat(jws.protected !== void 0 ? encode(jws.protected) : new Uint8Array(), encode("."), typeof jws.payload === "string" ? b64 ? encode(jws.payload) : encoder.encode(jws.payload) : jws.payload);
  let signature;
  try {
    signature = decode(jws.signature);
  } catch {
    throw new JWSInvalid("Failed to base64url decode the signature");
  }
  const k = await normalizeKey(key, alg);
  const verified = await verify(alg, k, signature, data);
  if (!verified) {
    throw new JWSSignatureVerificationFailed();
  }
  let payload;
  if (b64) {
    try {
      payload = decode(jws.payload);
    } catch {
      throw new JWSInvalid("Failed to base64url decode the payload");
    }
  } else if (typeof jws.payload === "string") {
    payload = encoder.encode(jws.payload);
  } else {
    payload = jws.payload;
  }
  const result = { payload };
  if (jws.protected !== void 0) {
    result.protectedHeader = parsedProt;
  }
  if (jws.header !== void 0) {
    result.unprotectedHeader = jws.header;
  }
  if (resolvedKey) {
    return { ...result, key: k };
  }
  return result;
}
__name(flattenedVerify, "flattenedVerify");
__name2(flattenedVerify, "flattenedVerify");
async function compactVerify(jws, key, options) {
  if (jws instanceof Uint8Array) {
    jws = decoder.decode(jws);
  }
  if (typeof jws !== "string") {
    throw new JWSInvalid("Compact JWS must be a string or Uint8Array");
  }
  const { 0: protectedHeader, 1: payload, 2: signature, length } = jws.split(".");
  if (length !== 3) {
    throw new JWSInvalid("Invalid Compact JWS");
  }
  const verified = await flattenedVerify({ payload, protected: protectedHeader, signature }, key, options);
  const result = { payload: verified.payload, protectedHeader: verified.protectedHeader };
  if (typeof key === "function") {
    return { ...result, key: verified.key };
  }
  return result;
}
__name(compactVerify, "compactVerify");
__name2(compactVerify, "compactVerify");
var epoch = /* @__PURE__ */ __name2((date) => Math.floor(date.getTime() / 1e3), "epoch");
var minute = 60;
var hour = minute * 60;
var day = hour * 24;
var week = day * 7;
var year = day * 365.25;
var REGEX = /^(\+|\-)? ?(\d+|\d+\.\d+) ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)(?: (ago|from now))?$/i;
function secs(str) {
  const matched = REGEX.exec(str);
  if (!matched || matched[4] && matched[1]) {
    throw new TypeError("Invalid time period format");
  }
  const value = parseFloat(matched[2]);
  const unit = matched[3].toLowerCase();
  let numericDate;
  switch (unit) {
    case "sec":
    case "secs":
    case "second":
    case "seconds":
    case "s":
      numericDate = Math.round(value);
      break;
    case "minute":
    case "minutes":
    case "min":
    case "mins":
    case "m":
      numericDate = Math.round(value * minute);
      break;
    case "hour":
    case "hours":
    case "hr":
    case "hrs":
    case "h":
      numericDate = Math.round(value * hour);
      break;
    case "day":
    case "days":
    case "d":
      numericDate = Math.round(value * day);
      break;
    case "week":
    case "weeks":
    case "w":
      numericDate = Math.round(value * week);
      break;
    default:
      numericDate = Math.round(value * year);
      break;
  }
  if (matched[1] === "-" || matched[4] === "ago") {
    return -numericDate;
  }
  return numericDate;
}
__name(secs, "secs");
__name2(secs, "secs");
function validateInput(label, input) {
  if (!Number.isFinite(input)) {
    throw new TypeError(`Invalid ${label} input`);
  }
  return input;
}
__name(validateInput, "validateInput");
__name2(validateInput, "validateInput");
var normalizeTyp = /* @__PURE__ */ __name2((value) => {
  if (value.includes("/")) {
    return value.toLowerCase();
  }
  return `application/${value.toLowerCase()}`;
}, "normalizeTyp");
var checkAudiencePresence = /* @__PURE__ */ __name2((audPayload, audOption) => {
  if (typeof audPayload === "string") {
    return audOption.includes(audPayload);
  }
  if (Array.isArray(audPayload)) {
    return audOption.some(Set.prototype.has.bind(new Set(audPayload)));
  }
  return false;
}, "checkAudiencePresence");
function validateClaimsSet(protectedHeader, encodedPayload, options = {}) {
  let payload;
  try {
    payload = JSON.parse(decoder.decode(encodedPayload));
  } catch {
  }
  if (!isObject(payload)) {
    throw new JWTInvalid("JWT Claims Set must be a top-level JSON object");
  }
  const { typ } = options;
  if (typ && (typeof protectedHeader.typ !== "string" || normalizeTyp(protectedHeader.typ) !== normalizeTyp(typ))) {
    throw new JWTClaimValidationFailed('unexpected "typ" JWT header value', payload, "typ", "check_failed");
  }
  const { requiredClaims = [], issuer, subject, audience, maxTokenAge } = options;
  const presenceCheck = [...requiredClaims];
  if (maxTokenAge !== void 0)
    presenceCheck.push("iat");
  if (audience !== void 0)
    presenceCheck.push("aud");
  if (subject !== void 0)
    presenceCheck.push("sub");
  if (issuer !== void 0)
    presenceCheck.push("iss");
  for (const claim of new Set(presenceCheck.reverse())) {
    if (!(claim in payload)) {
      throw new JWTClaimValidationFailed(`missing required "${claim}" claim`, payload, claim, "missing");
    }
  }
  if (issuer && !(Array.isArray(issuer) ? issuer : [issuer]).includes(payload.iss)) {
    throw new JWTClaimValidationFailed('unexpected "iss" claim value', payload, "iss", "check_failed");
  }
  if (subject && payload.sub !== subject) {
    throw new JWTClaimValidationFailed('unexpected "sub" claim value', payload, "sub", "check_failed");
  }
  if (audience && !checkAudiencePresence(payload.aud, typeof audience === "string" ? [audience] : audience)) {
    throw new JWTClaimValidationFailed('unexpected "aud" claim value', payload, "aud", "check_failed");
  }
  let tolerance;
  switch (typeof options.clockTolerance) {
    case "string":
      tolerance = secs(options.clockTolerance);
      break;
    case "number":
      tolerance = options.clockTolerance;
      break;
    case "undefined":
      tolerance = 0;
      break;
    default:
      throw new TypeError("Invalid clockTolerance option type");
  }
  const { currentDate } = options;
  const now = epoch(currentDate || /* @__PURE__ */ new Date());
  if ((payload.iat !== void 0 || maxTokenAge) && typeof payload.iat !== "number") {
    throw new JWTClaimValidationFailed('"iat" claim must be a number', payload, "iat", "invalid");
  }
  if (payload.nbf !== void 0) {
    if (typeof payload.nbf !== "number") {
      throw new JWTClaimValidationFailed('"nbf" claim must be a number', payload, "nbf", "invalid");
    }
    if (payload.nbf > now + tolerance) {
      throw new JWTClaimValidationFailed('"nbf" claim timestamp check failed', payload, "nbf", "check_failed");
    }
  }
  if (payload.exp !== void 0) {
    if (typeof payload.exp !== "number") {
      throw new JWTClaimValidationFailed('"exp" claim must be a number', payload, "exp", "invalid");
    }
    if (payload.exp <= now - tolerance) {
      throw new JWTExpired('"exp" claim timestamp check failed', payload, "exp", "check_failed");
    }
  }
  if (maxTokenAge) {
    const age = now - payload.iat;
    const max = typeof maxTokenAge === "number" ? maxTokenAge : secs(maxTokenAge);
    if (age - tolerance > max) {
      throw new JWTExpired('"iat" claim timestamp check failed (too far in the past)', payload, "iat", "check_failed");
    }
    if (age < 0 - tolerance) {
      throw new JWTClaimValidationFailed('"iat" claim timestamp check failed (it should be in the past)', payload, "iat", "check_failed");
    }
  }
  return payload;
}
__name(validateClaimsSet, "validateClaimsSet");
__name2(validateClaimsSet, "validateClaimsSet");
var JWTClaimsBuilder = class {
  static {
    __name(this, "JWTClaimsBuilder");
  }
  static {
    __name2(this, "JWTClaimsBuilder");
  }
  #payload;
  constructor(payload) {
    if (!isObject(payload)) {
      throw new TypeError("JWT Claims Set MUST be an object");
    }
    this.#payload = structuredClone(payload);
  }
  data() {
    return encoder.encode(JSON.stringify(this.#payload));
  }
  get iss() {
    return this.#payload.iss;
  }
  set iss(value) {
    this.#payload.iss = value;
  }
  get sub() {
    return this.#payload.sub;
  }
  set sub(value) {
    this.#payload.sub = value;
  }
  get aud() {
    return this.#payload.aud;
  }
  set aud(value) {
    this.#payload.aud = value;
  }
  set jti(value) {
    this.#payload.jti = value;
  }
  set nbf(value) {
    if (typeof value === "number") {
      this.#payload.nbf = validateInput("setNotBefore", value);
    } else if (value instanceof Date) {
      this.#payload.nbf = validateInput("setNotBefore", epoch(value));
    } else {
      this.#payload.nbf = epoch(/* @__PURE__ */ new Date()) + secs(value);
    }
  }
  set exp(value) {
    if (typeof value === "number") {
      this.#payload.exp = validateInput("setExpirationTime", value);
    } else if (value instanceof Date) {
      this.#payload.exp = validateInput("setExpirationTime", epoch(value));
    } else {
      this.#payload.exp = epoch(/* @__PURE__ */ new Date()) + secs(value);
    }
  }
  set iat(value) {
    if (value === void 0) {
      this.#payload.iat = epoch(/* @__PURE__ */ new Date());
    } else if (value instanceof Date) {
      this.#payload.iat = validateInput("setIssuedAt", epoch(value));
    } else if (typeof value === "string") {
      this.#payload.iat = validateInput("setIssuedAt", epoch(/* @__PURE__ */ new Date()) + secs(value));
    } else {
      this.#payload.iat = validateInput("setIssuedAt", value);
    }
  }
};
async function jwtVerify(jwt, key, options) {
  const verified = await compactVerify(jwt, key, options);
  if (verified.protectedHeader.crit?.includes("b64") && verified.protectedHeader.b64 === false) {
    throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
  }
  const payload = validateClaimsSet(verified.protectedHeader, verified.payload, options);
  const result = { payload, protectedHeader: verified.protectedHeader };
  if (typeof key === "function") {
    return { ...result, key: verified.key };
  }
  return result;
}
__name(jwtVerify, "jwtVerify");
__name2(jwtVerify, "jwtVerify");
async function sign(alg, key, data) {
  const cryptoKey = await getSigKey(alg, key, "sign");
  checkKeyLength(alg, cryptoKey);
  const signature = await crypto.subtle.sign(subtleAlgorithm(alg, cryptoKey.algorithm), cryptoKey, data);
  return new Uint8Array(signature);
}
__name(sign, "sign");
__name2(sign, "sign");
var FlattenedSign = class {
  static {
    __name(this, "FlattenedSign");
  }
  static {
    __name2(this, "FlattenedSign");
  }
  #payload;
  #protectedHeader;
  #unprotectedHeader;
  constructor(payload) {
    if (!(payload instanceof Uint8Array)) {
      throw new TypeError("payload must be an instance of Uint8Array");
    }
    this.#payload = payload;
  }
  setProtectedHeader(protectedHeader) {
    if (this.#protectedHeader) {
      throw new TypeError("setProtectedHeader can only be called once");
    }
    this.#protectedHeader = protectedHeader;
    return this;
  }
  setUnprotectedHeader(unprotectedHeader) {
    if (this.#unprotectedHeader) {
      throw new TypeError("setUnprotectedHeader can only be called once");
    }
    this.#unprotectedHeader = unprotectedHeader;
    return this;
  }
  async sign(key, options) {
    if (!this.#protectedHeader && !this.#unprotectedHeader) {
      throw new JWSInvalid("either setProtectedHeader or setUnprotectedHeader must be called before #sign()");
    }
    if (!isDisjoint(this.#protectedHeader, this.#unprotectedHeader)) {
      throw new JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
    }
    const joseHeader = {
      ...this.#protectedHeader,
      ...this.#unprotectedHeader
    };
    const extensions = validateCrit(JWSInvalid, /* @__PURE__ */ new Map([["b64", true]]), options?.crit, this.#protectedHeader, joseHeader);
    let b64 = true;
    if (extensions.has("b64")) {
      b64 = this.#protectedHeader.b64;
      if (typeof b64 !== "boolean") {
        throw new JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
      }
    }
    const { alg } = joseHeader;
    if (typeof alg !== "string" || !alg) {
      throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
    }
    checkKeyType(alg, key, "sign");
    let payloadS;
    let payloadB;
    if (b64) {
      payloadS = encode2(this.#payload);
      payloadB = encode(payloadS);
    } else {
      payloadB = this.#payload;
      payloadS = "";
    }
    let protectedHeaderString;
    let protectedHeaderBytes;
    if (this.#protectedHeader) {
      protectedHeaderString = encode2(JSON.stringify(this.#protectedHeader));
      protectedHeaderBytes = encode(protectedHeaderString);
    } else {
      protectedHeaderString = "";
      protectedHeaderBytes = new Uint8Array();
    }
    const data = concat(protectedHeaderBytes, encode("."), payloadB);
    const k = await normalizeKey(key, alg);
    const signature = await sign(alg, k, data);
    const jws = {
      signature: encode2(signature),
      payload: payloadS
    };
    if (this.#unprotectedHeader) {
      jws.header = this.#unprotectedHeader;
    }
    if (this.#protectedHeader) {
      jws.protected = protectedHeaderString;
    }
    return jws;
  }
};
var CompactSign = class {
  static {
    __name(this, "CompactSign");
  }
  static {
    __name2(this, "CompactSign");
  }
  #flattened;
  constructor(payload) {
    this.#flattened = new FlattenedSign(payload);
  }
  setProtectedHeader(protectedHeader) {
    this.#flattened.setProtectedHeader(protectedHeader);
    return this;
  }
  async sign(key, options) {
    const jws = await this.#flattened.sign(key, options);
    if (jws.payload === void 0) {
      throw new TypeError("use the flattened module for creating JWS with b64: false");
    }
    return `${jws.protected}.${jws.payload}.${jws.signature}`;
  }
};
var SignJWT = class {
  static {
    __name(this, "SignJWT");
  }
  static {
    __name2(this, "SignJWT");
  }
  #protectedHeader;
  #jwt;
  constructor(payload = {}) {
    this.#jwt = new JWTClaimsBuilder(payload);
  }
  setIssuer(issuer) {
    this.#jwt.iss = issuer;
    return this;
  }
  setSubject(subject) {
    this.#jwt.sub = subject;
    return this;
  }
  setAudience(audience) {
    this.#jwt.aud = audience;
    return this;
  }
  setJti(jwtId) {
    this.#jwt.jti = jwtId;
    return this;
  }
  setNotBefore(input) {
    this.#jwt.nbf = input;
    return this;
  }
  setExpirationTime(input) {
    this.#jwt.exp = input;
    return this;
  }
  setIssuedAt(input) {
    this.#jwt.iat = input;
    return this;
  }
  setProtectedHeader(protectedHeader) {
    this.#protectedHeader = protectedHeader;
    return this;
  }
  async sign(key, options) {
    const sig = new CompactSign(this.#jwt.data());
    sig.setProtectedHeader(this.#protectedHeader);
    if (Array.isArray(this.#protectedHeader?.crit) && this.#protectedHeader.crit.includes("b64") && this.#protectedHeader.b64 === false) {
      throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
    }
    return sig.sign(key, options);
  }
};
var CURRENT_CORS_ORIGIN = "https://www.peng-zhan.com";
var ALLOWED_ORIGINS = /* @__PURE__ */ new Set([
  "https://www.peng-zhan.com",
  "https://peng-zhan.com",
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:8787"
]);
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": CURRENT_CORS_ORIGIN,
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Cache-Control": "no-store"
    }
  });
}
__name(json, "json");
__name2(json, "json");
function corsPreflight() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": CURRENT_CORS_ORIGIN,
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Max-Age": "86400"
    }
  });
}
__name(corsPreflight, "corsPreflight");
__name2(corsPreflight, "corsPreflight");
function badRequest(msg) {
  return json({ error: msg }, 400);
}
__name(badRequest, "badRequest");
__name2(badRequest, "badRequest");
function errorJson(message2, status = 500) {
  return json({ error: message2 }, status);
}
__name(errorJson, "errorJson");
__name2(errorJson, "errorJson");
function safeJsonParse(raw, fallback) {
  try {
    if (typeof raw !== "string") return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
__name(safeJsonParse, "safeJsonParse");
__name2(safeJsonParse, "safeJsonParse");
function publishTransform(draft, env) {
  const snapshot = structuredClone(draft);
  if (snapshot?.hero?.image?.key) {
    snapshot.hero.image = cdnUrlFromKey(snapshot.hero.image.key, env);
  }
  if (Array.isArray(snapshot?.banners)) {
    snapshot.banners = snapshot.banners.map((b) => ({
      ...b,
      image: b?.image?.key ? cdnUrlFromKey(b.image.key, env) : b.image
    }));
  }
  return snapshot;
}
__name(publishTransform, "publishTransform");
__name2(publishTransform, "publishTransform");
// PZ V2 organization / delegated accounts. Embedded verbatim in review Worker bundles.
// IMPORTANT: env.PZ_ORG_RBAC_ENABLED must be "true" and migration 009 must exist.
// The existing users.role stays admin/factory; supervisor identity is derived from D1.
async function pzOrgEffectiveRole(env, userId, baseRole) {
  const role = String(baseRole || '').toLowerCase();
  if (role === 'admin') return 'ADMIN';
  if (role !== 'factory') return null; // never turn an unknown role into FACTORY
  // Before migration, preserve existing factory accounts.
  const schema = await env.DB.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='pz_staff_assignments' LIMIT 1"
  ).first();
  if (!schema) return 'FACTORY';
  const assignment = await env.DB.prepare(
    "SELECT job_type FROM pz_staff_assignments WHERE user_id=? LIMIT 1"
  ).bind(userId).first();
  // Rollback safety: disabling the feature cannot turn newly delegated
  // supervisors/secretaries into unrestricted legacy factory accounts.
  if (env.PZ_ORG_RBAC_ENABLED !== 'true') return assignment ? null : 'FACTORY';
  return assignment?.job_type === 'supervisor' ? 'SUPERVISOR' : 'FACTORY';
}

async function pzOrgCanManageProduct(env, userId, productId=null) {
  if (env.PZ_ORG_RBAC_ENABLED !== 'true') return true;
  const assigned = await env.DB.prepare(
    "SELECT a.user_id FROM pz_staff_assignments a JOIN pz_departments d ON d.id=a.department_id " +
    "WHERE a.user_id=? AND a.job_type IN ('secretary','staff','data_entry') AND d.is_active=1 LIMIT 1"
  ).bind(userId).first();
  if (!assigned) return false;
  if (!productId) return true;
  const owned = await env.DB.prepare(
    "SELECT id FROM products WHERE id=? AND created_by=? LIMIT 1"
  ).bind(productId,userId).first();
  return Boolean(owned);
}

function pzOrgPasswordPolicy(password,username='') {
  if (typeof password!=='string' || password.length<12 ||
      new TextEncoder().encode(password).length>72 || !password.trim()) return 'Password must be 12-72 UTF-8 bytes';
  if (username.length>=3 && password.toLowerCase().includes(username.toLowerCase()))
    return 'Password must not contain account name';
  return null;
}

function pzOrganizationCreateFetch(originalFetch, { authorize, json, hash, passwordPolicy }) {
  const fail = (message, status=400) => json({ error: message }, status);
  const safeName = value => typeof value === 'string' &&
    value.trim().length >= 2 && value.trim().length <= 80 &&
    !/[\s\u0000-\u001f\u007f]/u.test(value.trim());
  const jobTypes = new Set(['supervisor','secretary','staff','data_entry']);
  const createRoles = new Set(['secretary','staff','data_entry']);
  const jsonBody = async request => {
    try {
      const body = await request.json();
      return body && typeof body === 'object' && !Array.isArray(body) ? body : null;
    } catch { return null; }
  };
  async function actorAssignment(env, id) {
    return env.DB.prepare(
      "SELECT a.department_id, a.job_type, d.is_active FROM pz_staff_assignments a " +
      "JOIN pz_departments d ON d.id=a.department_id WHERE a.user_id=? LIMIT 1"
    ).bind(id).first();
  }
  async function validSupervisor(env,id,departmentId) {
    const user = await env.DB.prepare(
      "SELECT u.id FROM users u JOIN pz_staff_assignments a ON a.user_id=u.id " +
      "JOIN pz_departments d ON d.id=a.department_id " +
      "WHERE u.id=? AND lower(u.role)='factory' AND u.is_active=1 " +
      "AND a.job_type='supervisor' AND a.department_id=? AND d.is_active=1 LIMIT 1"
    ).bind(id,departmentId).first();
    return Boolean(user);
  }
  async function managedTarget(env,id,supervisorId) {
    return env.DB.prepare(
      "SELECT u.id,u.username,u.is_active,a.job_type,a.department_id FROM users u " +
      "JOIN pz_staff_assignments a ON a.user_id=u.id " +
      "WHERE u.id=? AND a.supervisor_id=? AND a.job_type IN ('secretary','staff','data_entry') LIMIT 1"
    ).bind(id,supervisorId).first();
  }
  return async function organizationFetch(request,env,ctx) {
    const path = new URL(request.url).pathname;
    const admin = path.startsWith('/admin/org/');
    const supervisor = path === '/supervisor/accounts' || /^\/supervisor\/accounts\/[^/]+(?:\/password)?$/.test(path);
    if (!admin && !supervisor) return originalFetch.call(this,request,env,ctx);
    if (env.PZ_ORG_RBAC_ENABLED !== 'true') return fail('Organization management not enabled',404);
    if (!env.DB) return fail('D1 unavailable',503);
    const auth = await authorize(request,env,admin?['ADMIN']:['SUPERVISOR']);
    if (auth instanceof Response) return auth;
    const actor = auth.user.id;
    const method = request.method;
    const now = new Date().toISOString();

    if (path === '/admin/org/departments' && method === 'GET') {
      const result = await env.DB.prepare(
        "SELECT id,name,factory_site,is_active,created_at FROM pz_departments ORDER BY name"
      ).all();
      return json({ items: result.results || [] });
    }
    if (path === '/admin/org/departments' && method === 'POST') {
      const body=await jsonBody(request);
      if (!body || typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length>100 ||
        !['zhaoqing','kandal','shared'].includes(body.factory_site)) return fail('Invalid department');
      const id=crypto.randomUUID();
      try {
        await env.DB.prepare(
          "INSERT INTO pz_departments (id,name,factory_site,created_by,created_at) VALUES (?,?,?,?,?)"
        ).bind(id,body.name.trim(),body.factory_site,actor,now).run();
      } catch (err) {
        if (/UNIQUE|CONSTRAINT/i.test(String(err))) return fail('Department already exists',409);
        throw err;
      }
      return json({success:true,id},201);
    }
    if (path === '/admin/org/accounts' && method === 'GET') {
      const rows=await env.DB.prepare(
        "SELECT u.id,u.username,u.role,u.is_active,a.department_id,a.supervisor_id,a.job_type," +
        "d.name AS department_name FROM users u LEFT JOIN pz_staff_assignments a ON a.user_id=u.id " +
        "LEFT JOIN pz_departments d ON d.id=a.department_id ORDER BY u.username LIMIT 1000"
      ).all();
      return json({users:rows.results||[]});
    }
    if (path === '/supervisor/accounts' && method === 'GET') {
      const rows=await env.DB.prepare(
        "SELECT u.id,u.username,u.is_active,a.job_type,a.department_id,a.supervisor_id " +
        "FROM users u JOIN pz_staff_assignments a ON a.user_id=u.id " +
        "WHERE a.supervisor_id=? AND a.job_type IN ('secretary','staff','data_entry') " +
        "ORDER BY u.username LIMIT 500"
      ).bind(actor).all();
      return json({users:rows.results||[]});
    }
    if ((path === '/admin/org/accounts' || path === '/supervisor/accounts') && method === 'POST') {
      const body=await jsonBody(request);
      if (!body || !safeName(body.username) || typeof body.password !== 'string') return fail('Invalid account fields');
      const passwordError=passwordPolicy(body.password,body.username.trim());
      if (passwordError) return fail(passwordError);
      const kind=String(body.job_type||'').toLowerCase();
      if (!jobTypes.has(kind) || (!admin && !createRoles.has(kind))) return fail('Cannot grant requested role',403);
      const own = admin ? null : await actorAssignment(env,actor);
      if (!admin && (!own || own.job_type!=='supervisor' || own.is_active!==1)) return fail('Supervisor assignment unavailable',403);
      const departmentId=admin ? String(body.department_id||'') : own.department_id;
      const department=await env.DB.prepare("SELECT id FROM pz_departments WHERE id=? AND is_active=1").bind(departmentId).first();
      if (!department) return fail('Department missing or disabled',409);
      const supervisorId=kind==='supervisor' ? null : admin ? String(body.supervisor_id||'') : actor;
      if (kind!=='supervisor' && !(await validSupervisor(env,supervisorId,departmentId))) return fail('Invalid supervisor for department',409);
      const existing=await env.DB.prepare("SELECT id FROM users WHERE lower(username)=lower(?) LIMIT 1").bind(body.username.trim()).first();
      if (existing) return fail('Account name already exists',409);
      const id=crypto.randomUUID();
      const passwordHash=await hash(body.password,10);
      // D1 batch is atomic. Do not leave orphaned users on a failed assignment.
      try {
        await env.DB.batch([
          env.DB.prepare("INSERT INTO users (id,username,password_hash,role,is_active,org_id,created_at) VALUES (?,?,?,?,1,?,?)")
            .bind(id,body.username.trim(),passwordHash,'factory','org-main',now),
          env.DB.prepare("INSERT INTO pz_staff_assignments (user_id,department_id,supervisor_id,job_type,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?)")
            .bind(id,departmentId,supervisorId,kind,actor,now,now)
        ]);
      } catch (err) {
        if (/UNIQUE|CONSTRAINT|FOREIGN KEY/i.test(String(err))) return fail('Account conflict; no account created',409);
        throw err;
      }
      return json({success:true,id,job_type:kind,department_id:departmentId,supervisor_id:supervisorId},201);
    }
    if (path === '/admin/org/assignments' && method === 'POST') {
      const body=await jsonBody(request);
      const userId=typeof body?.user_id==='string'?body.user_id:'';
      const departmentId=typeof body?.department_id==='string'?body.department_id:'';
      const supervisorId=typeof body?.supervisor_id==='string'?body.supervisor_id:'';
      const kind=String(body?.job_type||'staff').toLowerCase();
      if (!userId || !createRoles.has(kind) || !(await validSupervisor(env,supervisorId,departmentId)))
        return fail('Invalid assignment',409);
      const target=await env.DB.prepare("SELECT id FROM users WHERE id=? AND lower(role)='factory' AND is_active=1").bind(userId).first();
      if (!target || userId===supervisorId) return fail('Only active factory users can be assigned',403);
      const existing=await env.DB.prepare("SELECT job_type FROM pz_staff_assignments WHERE user_id=?").bind(userId).first();
      if (existing?.job_type==='supervisor') return fail('Cannot reassign supervisor as staff',403);
      await env.DB.prepare(
        "INSERT INTO pz_staff_assignments (user_id,department_id,supervisor_id,job_type,created_by,created_at,updated_at) " +
        "VALUES (?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET department_id=excluded.department_id," +
        "supervisor_id=excluded.supervisor_id,job_type=excluded.job_type,updated_at=excluded.updated_at"
      ).bind(userId,departmentId,supervisorId,kind,actor,now,now).run();
      return json({success:true,id:userId});
    }
    const match=path.match(/^\/supervisor\/accounts\/([^/]+)(?:\/(password))?$/);
    if (match && (method==='PATCH' || (method==='POST' && match[2]==='password'))) {
      const id=decodeURIComponent(match[1]);
      const target=await managedTarget(env,id,actor);
      if (!target) return fail('Account not in your team',403);
      const own=await actorAssignment(env,actor);
      if (!own || own.job_type!=='supervisor' || own.department_id!==target.department_id || own.is_active!==1)
        return fail('Department permission denied',403);
      const body=await jsonBody(request);
      if (!body) return fail('Invalid request');
      if (match[2]==='password') {
        if (typeof body.password!=='string') return fail('Missing password');
        const error=passwordPolicy(body.password,target.username);
        if (error) return fail(error);
        const digest=await hash(body.password,10);
        await env.DB.prepare("UPDATE users SET password_hash=? WHERE id=?").bind(digest,id).run();
      } else {
        if (typeof body.is_active!=='boolean' || Object.keys(body).some(k=>k!=='is_active'))
          return fail('Only account activation may be changed');
        await env.DB.prepare("UPDATE users SET is_active=? WHERE id=?").bind(body.is_active?1:0,id).run();
      }
      return json({success:true,id});
    }
    return fail('Method or organization endpoint not found',405);
  };
}

// Phase 2 REVIEW-only Worker module. Requires Staging D1 migration 010.
// This workflow handles NEW products; published-product revisions use a later
// separate draft implementation, never direct edits to live product rows.
function pzTwoStageReviewFetch(originalFetch,{authorize,json}) {
  const fail=(error,status=400)=>json({error},status);
  const now=()=>new Date().toISOString();
  const readBody=async request=>{
    try {const x=await request.json();return x&&typeof x==='object'&&!Array.isArray(x)?x:null;}
    catch{return null;}
  };
  const join="SELECT r.*,p.name,p.name_cn,p.code,p.category,p.images FROM pz_product_reviews r "+
    "JOIN products p ON p.id=r.product_id";
  const productSql="SELECT id,name,name_cn,category,sub_category,material,size,finish,code,"+
    "description,description_cn,images,production_sites,created_by,status,created_at,updated_at "+
    "FROM products WHERE id=? LIMIT 1";
  const staff=async(env,id)=>env.DB.prepare(
    "SELECT a.department_id,a.supervisor_id FROM pz_staff_assignments a "+
    "JOIN pz_departments d ON d.id=a.department_id "+
    "JOIN users s ON s.id=a.supervisor_id AND s.is_active=1 "+
    "JOIN pz_staff_assignments sa ON sa.user_id=s.id "+
    "WHERE a.user_id=? AND a.job_type IN ('secretary','staff','data_entry') "+
    "AND d.is_active=1 AND sa.job_type='supervisor' "+
    "AND sa.department_id=a.department_id LIMIT 1"
  ).bind(id).first();
  const snapshot=product=>{
    const {id,name,name_cn,category,sub_category,material,size,finish,code,
      description,description_cn,images,production_sites,created_by,created_at}=product;
    return JSON.stringify({id,name,name_cn,category,sub_category,material,size,finish,
      code,description,description_cn,images:typeof images==='string'?JSON.parse(images||'[]'):images,
      production_sites:typeof production_sites==='string'?JSON.parse(production_sites||'[]'):production_sites,
      created_by,created_at});
  };
  const hydrate=async(env,review)=>{
    const [vs,es]=await Promise.all([
      env.DB.prepare("SELECT version,snapshot_json,submitted_by,created_at FROM pz_product_review_versions WHERE review_id=? ORDER BY version").bind(review.id).all(),
      env.DB.prepare("SELECT id,action,actor_id,actor_role,review_version,note,created_at FROM pz_product_review_events WHERE review_id=? ORDER BY created_at,id").bind(review.id).all()
    ]);
    return { ...review,
      versions:(vs.results||[]).map(v=>({version:v.version,snapshot:JSON.parse(v.snapshot_json),submitted_by:v.submitted_by,created_at:v.created_at})),
      events:es.results||[]
    };
  };
  async function transition(env,review,target,role,actor,action,note=null){
    const stamp=now();
    const writes=[
      env.DB.prepare("UPDATE pz_product_reviews SET status=?,return_reason=?,approved_version="+
        (target==='approved_pending_publish'?"latest_version":"approved_version")+
        ",updated_at=? WHERE id=? AND status=? AND latest_version=?")
        .bind(target,note,stamp,review.id,review.status,review.latest_version),
      env.DB.prepare("UPDATE products SET status=?,updated_at=? WHERE id=? AND lower(status)=? "+
        "AND EXISTS (SELECT 1 FROM pz_product_reviews WHERE id=? AND status=? AND latest_version=?)")
        .bind(target,stamp,review.product_id,String(review.status).toLowerCase(),review.id,target,review.latest_version),
      env.DB.prepare("INSERT INTO pz_product_review_events"+
        "(id,review_id,action,actor_id,actor_role,review_version,note,created_at) "+
        "SELECT ?,id,?,?,?,?,?,? FROM pz_product_reviews WHERE id=? AND status=? AND latest_version=?")
        .bind(crypto.randomUUID(),action,actor,role,review.latest_version,note,stamp,review.id,target,review.latest_version)
    ];
    const outcome=await env.DB.batch(writes);
    if(outcome.some(x=>Number(x.meta?.changes)!==1))
      return fail('Review changed concurrently; refresh before retry',409);
    return json({success:true,id:review.id,product_id:review.product_id,status:target,version:review.latest_version});
  }
  return async function reviewFetch(request,env,ctx){
    const path=new URL(request.url).pathname,method=request.method;
    if(env.PZ_TWO_STAGE_REVIEW_ENABLED!=='true')return originalFetch.call(this,request,env,ctx);
    if(env.PZ_ORG_RBAC_ENABLED!=='true')return fail('Organization management must be enabled first',503);
    // Existing direct admin mutations can bypass the new approval state machine.
    if((/^\/admin\/products(?:\/[^/]+)?$/.test(path)&&['POST','PUT','DELETE'].includes(method)) ||
      (/^\/(?:admin|factory)\/products\/[^/]+\/remove-image$/.test(path)&&method==='POST'))
      return fail('Legacy direct admin product writes disabled during two-stage review',409);

    const submit=path.match(/^\/factory\/products\/([^/]+)\/submit$/);
    if(submit&&method==='POST'){
      const auth=await authorize(request,env,['FACTORY']);
      if(auth instanceof Response)return auth;
      const actor=auth.user.id,id=decodeURIComponent(submit[1]);
      const assignment=await staff(env,actor);
      if(!assignment)return fail('Active supervisor assignment required',403);
      const product=await env.DB.prepare(productSql).bind(id).first();
      if(!product||product.created_by!==actor)return fail('Not your product',403);
      if(!['draft','rejected','returned_to_uploader'].includes(String(product.status).toLowerCase()))
        return fail('Product is not ready for submission',409);
      if(!String(product.name||'').trim()||!String(product.category||'').trim()||
        !/^PZ-[A-Z0-9][A-Z0-9_-]{1,39}$/.test(String(product.code||'').trim().toUpperCase()))
        return fail('Name, category and valid SKU are required');
      let copy;
      try{copy=snapshot(product);}catch{return fail('Invalid product image or site JSON');}
      const previous=await env.DB.prepare("SELECT * FROM pz_product_reviews WHERE product_id=?").bind(id).first();
      if(previous&&previous.status!=='returned_to_uploader')return fail('Review cannot be resubmitted in this state',409);
      if(previous&&(previous.submitter_id!==actor||previous.supervisor_id!==assignment.supervisor_id||
        previous.department_id!==assignment.department_id))
        return fail('Review ownership changed: contact administrator',409);
      const stamp=now(),rid=previous?.id||crypto.randomUUID(),version=previous?previous.latest_version+1:1;
      const writes=[];
      if(previous)writes.push(env.DB.prepare(
        "UPDATE pz_product_reviews SET status='pending_supervisor',latest_version=?,return_reason=NULL,approved_version=NULL,updated_at=? "+
        "WHERE id=? AND status='returned_to_uploader' AND latest_version=?"
      ).bind(version,stamp,rid,previous.latest_version));
      else writes.push(env.DB.prepare(
        "INSERT INTO pz_product_reviews(id,product_id,submitter_id,supervisor_id,department_id,status,latest_version,created_at,updated_at) "+
        "SELECT ?,p.id,?,?,?,'pending_supervisor',1,?,? FROM products p "+
        "WHERE p.id=? AND p.created_by=? AND lower(p.status) IN ('draft','rejected')"
      ).bind(rid,actor,assignment.supervisor_id,assignment.department_id,stamp,stamp,id,actor));
      writes.push(env.DB.prepare(
        "UPDATE products SET status='pending_supervisor',updated_at=? WHERE id=? AND created_by=? "+
        "AND lower(status) IN ('draft','rejected','returned_to_uploader') "+
        "AND EXISTS (SELECT 1 FROM pz_product_reviews WHERE id=? AND status='pending_supervisor' AND latest_version=?)"
      ).bind(stamp,id,actor,rid,version));
      writes.push(env.DB.prepare(
        "INSERT INTO pz_product_review_versions(review_id,version,snapshot_json,submitted_by,created_at) "+
        "SELECT ?,?,?,?,? FROM pz_product_reviews WHERE id=? AND status='pending_supervisor' AND latest_version=?"
      ).bind(rid,version,copy,actor,stamp,rid,version));
      writes.push(env.DB.prepare(
        "INSERT INTO pz_product_review_events(id,review_id,action,actor_id,actor_role,review_version,note,created_at) "+
        "SELECT ?,?,?,?,?,?,NULL,? FROM pz_product_reviews WHERE id=? AND status='pending_supervisor' AND latest_version=?"
      ).bind(crypto.randomUUID(),rid,'submitted',actor,'FACTORY',version,stamp,rid,version));
      try {
        const outcome=await env.DB.batch(writes);
        if(outcome.some(x=>Number(x.meta?.changes)!==1))return fail('Concurrent product change; check record',409);
      }catch(err){
        if(/UNIQUE|CONSTRAINT|FOREIGN KEY/i.test(String(err)))return fail('Review version conflict; reload',409);
        throw err;
      }
      return json({success:true,id:rid,product_id:id,status:'pending_supervisor',version});
    }
    const supervisor=path==='/supervisor/reviews'||path.startsWith('/supervisor/reviews/');
    const admin=path==='/admin/reviews'||path.startsWith('/admin/reviews/');
    const factoryDetail=/^\/factory\/reviews\/[^/]+$/.test(path)&&method==='GET';
    if(!supervisor&&!admin&&!factoryDetail)return originalFetch.call(this,request,env,ctx);
    const auth=await authorize(request,env,admin?['ADMIN']:supervisor?['SUPERVISOR']:['FACTORY']);
    if(auth instanceof Response)return auth;
    const actor=auth.user.id;
    if((path==='/admin/reviews'||path==='/supervisor/reviews')&&method==='GET'){
      const items=await env.DB.prepare(join+(supervisor?" WHERE r.supervisor_id=?":"")+
        " ORDER BY r.updated_at DESC LIMIT 300").bind(...(supervisor?[actor]:[])).all();
      return json({items:items.results||[]});
    }
    const match=path.match(/^\/(?:admin|supervisor|factory)\/reviews\/([^/]+)(?:\/(approve|return|request-correction|publish))?$/);
    if(!match)return fail('Review endpoint not found',404);
    const id=decodeURIComponent(match[1]),action=match[2];
    const review=await env.DB.prepare(join+" WHERE r.id=? LIMIT 1").bind(id).first();
    if(!review)return fail('Review not found',404);
    if(supervisor){
      if(review.supervisor_id!==actor)return fail('Cannot review another supervisor department',403);
      const assignment=await env.DB.prepare(
        "SELECT user_id FROM pz_staff_assignments WHERE user_id=? AND job_type='supervisor' AND department_id=?"
      ).bind(actor,review.department_id).first();
      if(!assignment)return fail('Supervisor reassigned to another department',403);
    }
    if(factoryDetail&&review.submitter_id!==actor)return fail('Not your review',403);
    if(method==='GET'&&!action)return json(await hydrate(env,review));
    if(method!=='POST'||!action)return fail('Method not allowed',405);
    if(factoryDetail)return fail('Uploader cannot approve',403);
    const body=await readBody(request);
    const note=typeof body?.note==='string'?body.note.trim():'';
    if(['return','request-correction'].includes(action)&&(note.length<5||note.length>2000))
      return fail('Return reason must be 5–2000 characters');
    if(supervisor){
      if(action==='approve'&&review.status==='pending_supervisor')
        return transition(env,review,'pending_admin','SUPERVISOR',actor,'supervisor_approved');
      if(action==='return'&&review.status==='pending_supervisor')
        return transition(env,review,'returned_to_uploader','SUPERVISOR',actor,'supervisor_returned',note);
      if(action==='request-correction'&&review.status==='returned_to_supervisor')
        return transition(env,review,'returned_to_uploader','SUPERVISOR',actor,'correction_assigned',note);
      return fail('Supervisor action not allowed in this state',409);
    }
    if(actor===review.submitter_id||actor===review.supervisor_id)return fail('Self-approval prohibited',403);
    if(action==='approve'&&review.status==='pending_admin')
      return transition(env,review,'approved_pending_publish','ADMIN',actor,'admin_approved');
    if(action==='return'&&review.status==='pending_admin')
      return transition(env,review,'returned_to_supervisor','ADMIN',actor,'admin_returned',note);
    if(action==='publish'&&review.status==='approved_pending_publish'){
      const result=await transition(env,review,'published','ADMIN',actor,'published');
      if(result.status!==200)return result;
      // Republish catalog KV with existing, authenticated admin endpoint.
      const next=new Request(new URL('/admin/publish/products',request.url),{
        method:'POST',headers:{Authorization:request.headers.get('Authorization')||''}
      });
      const published=await originalFetch.call(this,next,env,ctx);
      if(!published.ok)return json({error:'D1 published, catalog snapshot failed: retry admin publish products',review_id:id},503);
      return json({success:true,id,status:'published',catalog_published:true});
    }
    return fail('Admin action not allowed in this state',409);
  };
}

function normalizeRole(role) {
  if (role === "ADMIN" || role === "admin") return "ADMIN";
  if (role === "FACTORY" || role === "factory") return "FACTORY";
  if (role === "SUPERVISOR" || role === "supervisor") return "SUPERVISOR";
  return null;
}
__name(normalizeRole, "normalizeRole");
__name2(normalizeRole, "normalizeRole");
async function signToken(payload, secret) {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("12h").sign(new TextEncoder().encode(secret));
}
__name(signToken, "signToken");
__name2(signToken, "signToken");
async function verifyToken(token, secret) {
  return jwtVerify(token, new TextEncoder().encode(secret));
}
__name(verifyToken, "verifyToken");
__name2(verifyToken, "verifyToken");
// PR #15: Authentication hardening. Passwords and tokens never enter KV.
function pzAuthPasswordPolicyError(password, username = "") {
  if (typeof password !== "string") return "Password must be text";
  const bytes = new TextEncoder().encode(password).length;
  if (password.length < 12 || bytes > 72) return "Password must be at least 12 characters and at most 72 UTF-8 bytes";
  if (!password.trim()) return "Password cannot be blank";
  if (username && username.length >= 3 && password.toLowerCase().includes(String(username).toLowerCase())) {
    return "Password must not include the username";
  }
  const common = new Set(["password12345", "password123456", "123456789012", "qwerty123456", "admin123456789", "letmein123456"]);
  if (common.has(password.toLowerCase())) return "Please choose a less common password";
  return null;
}
async function pzAuthDigest(value) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(value)));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, "0")).join("");
}
// The fingerprint revokes previously issued JWTs when an account password is reset.
// Existing 7-day tokens without 'phv' will require a fresh login on deployment.
async function pzAuthPasswordVersion(passwordHash) {
  return (await pzAuthDigest(passwordHash)).slice(0, 32);
}
// This KV threshold is defense in depth, not an atomic distributed rate limiter.
// Add Cloudflare WAF rate limiting to /api/login and Worker /login separately.
async function pzAuthLoginRateKey(request, username) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  return "pz:auth:login:v1:" + await pzAuthDigest(String(username).toLowerCase() + "|" + ip);
}
async function pzAuthLoginTooMany(env, key) {
  const raw = await env.SITE_CONFIG_KV.get(key);
  if (!raw) return false;
  const value = safeJsonParse(raw, {});
  return Number(value.count || 0) >= 7 && Number(value.until || 0) > Date.now();
}
async function pzAuthLoginFailure(env, key) {
  const now = Date.now();
  const value = safeJsonParse(await env.SITE_CONFIG_KV.get(key), {});
  const active = Number(value.until || 0) > now;
  const count = active ? Math.min(100, Number(value.count || 0) + 1) : 1;
  const until = active ? Number(value.until) : now + 10 * 60 * 1000;
  await env.SITE_CONFIG_KV.put(key, JSON.stringify({ count, until }), { expirationTtl: Math.max(60, Math.ceil((until - now) / 1000)) });
}
async function getUserFromRequest(request, env) {
  const auth = request.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  try {
    const token = auth.slice(7);
    const { payload } = await verifyToken(token, env.JWT_SECRET);
    if (!payload?.sub || !payload?.username || !payload?.role) return null;
    return {
      id: String(payload.sub),
      username: String(payload.username),
      role: normalizeRole(payload.role),
      org_id: payload.org_id ? String(payload.org_id) : null,
      phv: typeof payload.phv === "string" ? payload.phv : ""
    };
  } catch {
    return null;
  }
}
__name(getUserFromRequest, "getUserFromRequest");
__name2(getUserFromRequest, "getUserFromRequest");
async function authorize(request, env, allowedRoles) {
  const user = await getUserFromRequest(request, env);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const current = await env.DB.prepare(
    "SELECT id, username, role, is_active, org_id, password_hash FROM users WHERE id = ? LIMIT 1"
  ).bind(user.id).first();
  if (!current || Number(current.is_active) !== 1) {
    return json({ error: "Account inactive or not found" }, 401);
  }
  if (!user.phv || user.phv !== await pzAuthPasswordVersion(current.password_hash)) {
    return json({ error: "Session expired; sign in again" }, 401);
  }
  const liveUser = {
    id: String(current.id),
    username: String(current.username),
    role: await pzOrgEffectiveRole(env, current.id, current.role),
    org_id: current.org_id || "org-main"
  };
  if (!allowedRoles.includes(liveUser.role)) {
    return json({ error: "Forbidden" }, 403);
  }
  return { user: liveUser };
}
__name(authorize, "authorize");
__name2(authorize, "authorize");
function pzConfiguredImageBase(env) {
  const runtime = String(env.PZ_RUNTIME_ENV || "").trim().toLowerCase();
  if (runtime !== "production" && runtime !== "staging") return null;
  const stagingLegacy = runtime === "staging" ? env.PZ_STAGING_IMAGE_BASE_URL : "";
  const raw = String(env.PZ_IMAGE_BASE_URL || stagingLegacy || "").trim().replace(/\/+$/, "");
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/") return null;
    const host = url.hostname.toLowerCase();
    if (runtime === "production") {
      if (host !== "cdn.peng-zhan.com") return null;
    } else if (host === "peng-zhan.com" || host.endsWith(".peng-zhan.com")) {
      return null;
    }
    return url.origin;
  } catch (_) {
    return null;
  }
}
__name(pzConfiguredImageBase, "pzConfiguredImageBase");
__name2(pzConfiguredImageBase, "pzConfiguredImageBase");
function cdnUrlFromKey(key, env) {
  const imageBase = pzConfiguredImageBase(env);
  if (!imageBase) throw new Error("Invalid PZ image environment configuration");
  return `${imageBase}/${encodeURIComponent(key)}`;
}
__name(cdnUrlFromKey, "cdnUrlFromKey");
__name2(cdnUrlFromKey, "cdnUrlFromKey");
function pzDetectedImageContentType(bytes) {
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg";
  if (bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v)) return "image/png";
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "image/webp";
  return null;
}
__name(pzDetectedImageContentType, "pzDetectedImageContentType");
__name2(pzDetectedImageContentType, "pzDetectedImageContentType");
function safeJsonParseArray(raw) {
  try {
    if (typeof raw !== "string") return [];
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
__name(safeJsonParseArray, "safeJsonParseArray");
__name2(safeJsonParseArray, "safeJsonParseArray");
function normalizeProductRows(rows) {
  const list = Array.isArray(rows) ? rows : [];
  return list.map((r) => {
    const images = safeJsonParseArray(r.images);
    return {
      id: r.id,
      name: r.name ?? "",
      name_cn: r.name_cn ?? "",
      category: r.category ?? "",
      sub_category: r.sub_category ?? "",
      material: r.material ?? "",
      size: r.size ?? "",
      finish: r.finish ?? "",
      code: r.code ?? "",
      description: r.description ?? "",
      description_cn: r.description_cn ?? "",
      images,
      production_sites: safeJsonParseArray(r.production_sites),
      ...r.created_by !== void 0 ? { created_by: r.created_by } : {},
      status: (r.status ?? "draft").toLowerCase(),
      created_at: r.created_at ?? null,
      updated_at: r.updated_at ?? null
    };
  });
}
__name(normalizeProductRows, "normalizeProductRows");
__name2(normalizeProductRows, "normalizeProductRows");
function coerceProductForDb(input) {
  const p = input && typeof input === "object" && "data" in input ? input.data ?? {} : input ?? {};
  const images = Array.isArray(p.images) ? p.images : [];
  const hasSites = Object.prototype.hasOwnProperty.call(p, "production_sites") || Object.prototype.hasOwnProperty.call(p, "productionSites");
  const sitesInput = Object.prototype.hasOwnProperty.call(p, "production_sites") ? p.production_sites : p.productionSites;
  let sitesJson = null;
  let sitesError = null;
  if (hasSites) {
    const allowedSites = /* @__PURE__ */ new Set(["zhaoqing", "cambodia"]);
    if (!Array.isArray(sitesInput) || sitesInput.length > 2 || !sitesInput.every((v) => typeof v === "string" && allowedSites.has(v)) || new Set(sitesInput).size !== sitesInput.length) {
      sitesError = "production_sites must be an array of unique values: zhaoqing, cambodia";
    } else {
      sitesJson = JSON.stringify(sitesInput);
    }
  }
  const statusRaw = typeof p.status === "string" ? p.status : "draft";
  const status = statusRaw.toLowerCase();
  return {
    name: String(p.name ?? ""),
    name_cn: String(p.name_cn ?? ""),
    category: String(p.category ?? ""),
    sub_category: String(p.sub_category ?? ""),
    material: String(p.material ?? ""),
    size: String(p.size ?? ""),
    finish: String(p.finish ?? "").slice(0, 240),
    code: String(p.code ?? "").trim().toUpperCase(),
    description: String(p.description ?? ""),
    description_cn: String(p.description_cn ?? ""),
    images_json: JSON.stringify(images),
    production_sites_json: sitesJson,
    production_sites_error: sitesError,
    status
  };
}
__name(coerceProductForDb, "coerceProductForDb");
__name2(coerceProductForDb, "coerceProductForDb");
var PZ_SKU_PATTERN = /^PZ-[A-Z0-9][A-Z0-9_-]{1,39}$/;
function pzSkuValidationError(sku, required = false) {
  if (!sku && !required) return null;
  if (!sku || !PZ_SKU_PATTERN.test(sku)) {
    return "Valid SKU required (e.g. PZ-BIRCH-001; 2-40 characters after PZ-).";
  }
  return null;
}
__name(pzSkuValidationError, "pzSkuValidationError");
function pzIsSkuConflict(error) {
  const message2 = String(error?.message ?? error ?? "");
  return /UNIQUE constraint failed|SQLITE_CONSTRAINT_UNIQUE|ux_products_sku_normalized/i.test(message2);
}
__name(pzIsSkuConflict, "pzIsSkuConflict");
var PZ_PUBLIC_COLUMNS = "id,name,name_cn,category,sub_category,material,size,finish,code,description,description_cn,images,production_sites,status,created_at,updated_at";
var PZ_PUBLIC_FILTER = "status = 'published' AND length(trim(coalesce(json_extract(CASE WHEN json_valid(images) THEN images ELSE '[]' END, '$[0]'), ''))) > 0";
function pzPublicJson(payload, request, status = 200) {
  const origin = request.headers.get("Origin") || "";
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=15",
      "Vary": "Origin",
      "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) ? origin : "https://www.peng-zhan.com",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
__name(pzPublicJson, "pzPublicJson");
function pzPublicCursorEncode(row) {
  return btoa(JSON.stringify({ t: row.updated_at, id: row.id })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
__name(pzPublicCursorEncode, "pzPublicCursorEncode");
function pzPublicCursorDecode(cursor) {
  if (!cursor) return null;
  if (cursor.length > 512 || !/^[A-Za-z0-9_-]+$/.test(cursor)) throw new Error("Invalid cursor");
  const raw = cursor.replace(/-/g, "+").replace(/_/g, "/");
  const parsed = JSON.parse(atob(raw.padEnd(Math.ceil(raw.length / 4) * 4, "=")));
  if (!parsed || typeof parsed.id !== "string" || typeof parsed.t !== "string" || parsed.id.length > 100 || parsed.t.length > 80 || !parsed.id || !parsed.t) throw new Error("Invalid cursor");
  return parsed;
}
__name(pzPublicCursorDecode, "pzPublicCursorDecode");
function pzPublicRow(row) {
  const normalized = normalizeProductRows([row])[0];
  normalized.images = normalized.images.filter((v) => typeof v === "string" && v.trim());
  return normalized;
}
__name(pzPublicRow, "pzPublicRow");
function pzEscapeLike(value) {
  return value.replace(/[\\%_]/g, "\\$&");
}
__name(pzEscapeLike, "pzEscapeLike");
async function pzHandlePublicProductsD1(request, env) {
  const params = new URL(request.url).searchParams;
  const category = (params.get("category") || "").toLowerCase().trim();
  const sub = (params.get("sub") || "").trim();
  const search = (params.get("q") || "").trim();
  const exact = (params.get("id") || "").trim();
  if (category.length > 100 || sub.length > 150 || search.length > 100 || exact.length > 150) {
    return pzPublicJson({ error: "Invalid filter" }, request, 400);
  }
  if (params.get("summary") === "categories") {
    const cats = await env.DB.prepare(
      "SELECT category, COUNT(*) AS count FROM products WHERE " + PZ_PUBLIC_FILTER + " GROUP BY category ORDER BY category"
    ).all();
    const subs = await env.DB.prepare(
      "SELECT category, sub_category, COUNT(*) AS count FROM products WHERE " + PZ_PUBLIC_FILTER + " AND sub_category IS NOT NULL AND sub_category <> '' GROUP BY category, sub_category ORDER BY sub_category"
    ).all();
    const categories = (cats.results || []).map((c) => ({
      id: c.category,
      count: Number(c.count) || 0,
      subCategories: (subs.results || []).filter((s) => s.category === c.category).map((s) => ({ name: s.sub_category, count: Number(s.count) || 0 }))
    }));
    return pzPublicJson({ categories }, request);
  }
  if (exact) {
    const row = await env.DB.prepare(
      "SELECT " + PZ_PUBLIC_COLUMNS + " FROM products WHERE " + PZ_PUBLIC_FILTER + " AND (id = ? OR code = ?) LIMIT 1"
    ).bind(exact, exact).first();
    return row ? pzPublicJson({ item: pzPublicRow(row) }, request) : pzPublicJson({ error: "Not found" }, request, 404);
  }
  const limit = Number(params.get("limit") || "24");
  if (!Number.isInteger(limit) || limit < 1 || limit > 48) {
    return pzPublicJson({ error: "limit must be 1\u201348" }, request, 400);
  }
  let cursor;
  try {
    cursor = pzPublicCursorDecode(params.get("cursor"));
  } catch (_) {
    return pzPublicJson({ error: "Invalid cursor" }, request, 400);
  }
  const predicates = [PZ_PUBLIC_FILTER];
  const values = [];
  if (category && category !== "all") {
    predicates.push("category = ?");
    values.push(category);
  }
  if (sub && sub.toLowerCase() !== "all") {
    predicates.push("sub_category = ?");
    values.push(sub);
  }
  if (search) {
    predicates.push("(name LIKE ? ESCAPE '\\' OR code LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\')");
    const pattern = "%" + pzEscapeLike(search) + "%";
    values.push(pattern, pattern, pattern);
  }
  if (cursor) {
    predicates.push("(updated_at < ? OR (updated_at = ? AND id < ?))");
    values.push(cursor.t, cursor.t, cursor.id);
  }
  values.push(limit + 1);
  const query = "SELECT " + PZ_PUBLIC_COLUMNS + " FROM products WHERE " + predicates.join(" AND ") + " ORDER BY updated_at DESC, id DESC LIMIT ?";
  const result = await env.DB.prepare(query).bind(...values).all();
  const rows = result.results || [];
  const hasMore = rows.length > limit;
  const pageRows = rows.slice(0, limit);
  return pzPublicJson({
    items: pageRows.map(pzPublicRow),
    nextCursor: hasMore && pageRows.length ? pzPublicCursorEncode(pageRows[pageRows.length - 1]) : null,
    hasMore
  }, request);
}
__name(pzHandlePublicProductsD1, "pzHandlePublicProductsD1");
// Production review candidate: NOT DEPLOYED. Requires full-worker integration,
// schema migration, regression tests and explicit release approval.
// This module NEVER writes published:site_config or edits legacy category_requests.
/**
 * Production category amendment routes — REVIEW ONLY. Integrate into the PRODUCTION Worker after explicit review
 * fetch() after existing authentication helpers, before the 404 fallback:
 *
 * const response = await handleCategoryChanges({
 *   request, env, pathname, authorize, json, badRequest
 * });
 * if (response) return response;
 *
 * Never deploy without Production migration, concurrency review and approval.
 */
const EDITABLE = ['title','title_cn','subtitle','description','image'];
const MAX = { title: 120, title_cn: 120, subtitle: 500, description: 2000, image: 2048 };
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const serial = (value) => JSON.stringify(value);

function fields(category) {
  const out = {};
  for (const key of EDITABLE) out[key] = String(category?.[key] ?? '');
  // Some existing categories use title_zh as the Chinese display name.
  if (!out.title_cn) out.title_cn = String(category?.title_zh ?? '');
  return out;
}

function conflict(message, json) {
  return json({ error: message, code: 'CATEGORY_CONFLICT' }, 409);
}

function parseRows(result) {
  return (result?.results ?? []).map(row => ({
    ...row,
    base: JSON.parse(row.base_json),
    proposed: JSON.parse(row.proposed_json)
  }));
}

function parseConfig(raw) {
  try {
    const config = JSON.parse(raw || 'null');
    return config && Array.isArray(config.categories) ? config : null;
  } catch { return null; }
}

function validateProposed(input, base, badRequest) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return badRequest('Invalid category changes');
  if (Object.keys(input).some(k => !EDITABLE.includes(k))) return badRequest('Unsupported category field');
  const next = { ...base };
  for (const key of EDITABLE) {
    if (!own(input, key)) continue;
    if (typeof input[key] !== 'string') return badRequest('Invalid field: ' + key);
    next[key] = input[key].trim();
    if (next[key].length > MAX[key]) return badRequest('Field too long: ' + key);
  }
  if (!next.title) return badRequest('English title required');
  if (serial(next) === serial(base)) return badRequest('No changes submitted');
  return next;
}

/**
 * Production images must be from the configured Production CDN and their
 * upload object must exist in the Production PRODUCT_IMAGES R2 bucket.
 */
function productionCategoryImageBase(env) {
  const runtime = String(env.PZ_RUNTIME_ENV || '').trim().toLowerCase();
  const configured = String(env.PZ_IMAGE_BASE_URL || '').trim().replace(/\/+$/, '');
  if (runtime !== 'production' || configured !== 'https://cdn.peng-zhan.com') return null;
  return configured;
}

async function validateReplacementImage(image, currentImage, env, imageBase, badRequest) {
  if (image === currentImage || image === '') return null;
  if (!imageBase || !env.PRODUCT_IMAGES) return badRequest('Staging image storage unavailable');
  let key;
  try {
    const url = new URL(image);
    if (url.origin !== imageBase || url.search || url.hash || url.username || url.password) {
      return badRequest('Cover must come from Production R2');
    }
    key = decodeURIComponent(url.pathname.slice(1));
    if (!/^uploads\/[^/]+$/.test(key) || key.includes('..')) return badRequest('Invalid image key');
  } catch { return badRequest('Invalid image URL'); }
  if (!(await env.PRODUCT_IMAGES.head(key))) return badRequest('Cover not found in Production R2');
  return null;
}

async function handleProductionCategoryChanges({ request, env, pathname, authorize, json, badRequest }) {
  const root = '/factory/category-change-requests';
  const adminRoot = '/admin/category-change-requests';
  const matchAction = pathname.match(/^\/admin\/category-change-requests\/([^/]+)\/(approve|reject|reconcile)$/);
  if (pathname !== root && pathname !== adminRoot && !matchAction) return null;

  // Explicit environment guard: never handle Production traffic with this module.
  if (String(env.PZ_RUNTIME_ENV || '').toLowerCase() !== 'production') {
    return json({ error: 'Production-only category change handler' }, 403);
  }
  const isAdmin = pathname.startsWith('/admin/');
  const auth = await authorize(request, env, isAdmin ? ['ADMIN'] : ['FACTORY','ADMIN']);
  if (auth instanceof Response) return auth;
  const actor = auth.user?.id;
  if (!actor) return json({ error: 'Missing authenticated account' }, 401);

  if (request.method === 'GET' && !matchAction) {
    const sql = isAdmin
      ? "SELECT * FROM category_change_requests ORDER BY created_at DESC LIMIT 500"
      : "SELECT * FROM category_change_requests WHERE created_by = ? ORDER BY created_at DESC LIMIT 100";
    const query = env.DB.prepare(sql);
    const rows = isAdmin ? await query.all() : await query.bind(actor).all();
    return json({ items: parseRows(rows) });
  }

  if (pathname === root && request.method === 'POST') {
    if (!(request.headers.get('content-type') || '').includes('application/json')) return json({ error: 'JSON required' }, 415);
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 12000) return json({ error: 'Request too large' }, 413);
    let body;
    try { body = JSON.parse(raw); } catch { return badRequest('Invalid JSON'); }
    const categoryId = typeof body?.category_id === 'string' ? body.category_id.trim() : '';
    if (!categoryId || categoryId.length > 120) return badRequest('Missing category_id');
    const published = pzD1SiteEnabled(env)
      ? await pzReadPublishedConfig(env)
      : parseConfig(await env.SITE_CONFIG_KV.get('published:site_config'));
    if (!published) return json({ error: 'Published category registry unavailable' }, 503);
    const existing = published.categories.find(c => c?.id === categoryId);
    if (!existing) return json({ error: 'Published category not found' }, 404);
    const base = fields(existing);
    const proposed = validateProposed(body.proposed, base, badRequest);
    if (proposed instanceof Response) return proposed;
    const requestedTitle = proposed.title.toLowerCase();
    if (published.categories.some(c => c?.id !== categoryId &&
      String(c?.title || '').trim().toLowerCase() === requestedTitle)) {
      return conflict('Another published category already uses this English title', json);
    }
    const imgError = await validateReplacementImage(proposed.image, base.image, env, productionCategoryImageBase(env), badRequest);
    if (imgError) return imgError;

    // Exactly one pending request per category, enforced by the partial unique index.
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    try {
      const inserted = await env.DB.prepare(
        "INSERT INTO category_change_requests (id,category_id,base_json,proposed_json,status,created_by,created_at,updated_at) VALUES (?,?,?,?, 'pending',?,?,?)"
      ).bind(id,categoryId,serial(base),serial(proposed),actor,now,now).run();
      if (inserted?.meta?.changes !== 1) return json({ error: 'Request not saved' }, 500);
    } catch (error) {
      if (/UNIQUE|CONSTRAINT/i.test(String(error?.message ?? error))) return conflict('Category already has a pending change request',json);
      throw error;
    }
    return json({ success: true, id, category_id: categoryId, status: 'pending' }, 201);
  }

  if (matchAction && request.method === 'POST') {
    const [, id, action] = matchAction;
    const row = await env.DB.prepare('SELECT * FROM category_change_requests WHERE id = ? LIMIT 1').bind(id).first();
    if (!row) return json({ error: 'Request not found' }, 404);
    const now = new Date().toISOString();
    if (action === 'reconcile') {
      if (row.status !== 'applying') return conflict('Request is not awaiting reconciliation', json);
      // Only confirm completion if the D1 proposal is already reflected in KV.
      // Do not reset an unknown partial commit based on potentially stale KV reads.
      const draft = parseConfig(await env.SITE_CONFIG_KV.get('draft:site_config'));
      const actual = draft?.categories.find(c => c.id === row.category_id);
      const proposed = JSON.parse(row.proposed_json);
      if (!actual || serial(fields(actual)) !== serial(proposed)) {
        return json({ error: 'Draft has not confirmed the proposal; keep applying and investigate', status:'applying' }, 409);
      }
      const done = await env.DB.prepare(
        "UPDATE category_change_requests SET status='approved', reviewed_by=?, reviewed_at=?, updated_at=? WHERE id=? AND status='applying'"
      ).bind(actor,now,now,id).run();
      if (done?.meta?.changes !== 1) return conflict('Request state changed during reconciliation', json);
      return json({ success:true, id, status:'approved', needsPublish:true, published:false, reconciled:true });
    }
    if (row.status !== 'pending') return conflict('Request has already been processed', json);
    if (action === 'reject') {
      const body = await request.json().catch(() => ({}));
      const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0,1000) : '';
      const result = await env.DB.prepare(
        "UPDATE category_change_requests SET status='rejected', reject_reason=?, reviewed_by=?, reviewed_at=?, updated_at=? WHERE id=? AND status='pending'"
      ).bind(reason,actor,now,now,id).run();
      if (result?.meta?.changes !== 1) return conflict('Request was processed elsewhere',json);
      return json({ success:true, id, status:'rejected' });
    }

    // Claim request first to prevent two admins applying the same proposal.
    const claim = await env.DB.prepare(
      "UPDATE category_change_requests SET status='applying', updated_at=? WHERE id=? AND status='pending'"
    ).bind(now,id).run();
    if (claim?.meta?.changes !== 1) return conflict('Request was processed elsewhere',json);
    let savedDraft = false;
    try {
      const [publishedRaw,draftRaw] = await Promise.all([
        env.SITE_CONFIG_KV.get('published:site_config'),
        env.SITE_CONFIG_KV.get('draft:site_config')
      ]);
      const published = parseConfig(publishedRaw);
      const draft = parseConfig(draftRaw);
      if (!published || !draft) return conflict('Site configuration draft is unavailable',json);
      const live = published.categories.find(c => c.id === row.category_id);
      const editable = draft.categories.find(c => c.id === row.category_id);
      const base = JSON.parse(row.base_json);
      if (!live || !editable || serial(fields(live)) !== serial(base) ||
          serial(fields(editable)) !== serial(base)) {
        return conflict('Category changed since submission; review and resubmit',json);
      }
      const proposed = JSON.parse(row.proposed_json);
      const requestedTitle = String(proposed.title || '').trim().toLowerCase();
      if ([...draft.categories, ...published.categories].some(c =>
        c?.id !== row.category_id && String(c?.title || '').trim().toLowerCase() === requestedTitle)) {
        return conflict('Another category now uses the proposed English title', json);
      }
      const err = await validateReplacementImage(proposed.image,base.image,env,productionCategoryImageBase(env),badRequest);
      if (err) return err;
      // Preserve id, subCategories, product relationships, and all unedited fields.
      draft.categories = draft.categories.map(c => c.id === row.category_id
        ? { ...c, ...proposed, title_zh: proposed.title_cn }
        : c);
      await env.SITE_CONFIG_KV.put('draft:site_config',JSON.stringify(draft));
      savedDraft = true;
      const completed = await env.DB.prepare(
        "UPDATE category_change_requests SET status='approved', reviewed_by=?, reviewed_at=?, updated_at=? WHERE id=? AND status='applying'"
      ).bind(actor,now,now,id).run();
      if (completed?.meta?.changes !== 1) {
        // Draft may already contain the change. Leave 'applying' for review.
        return json({ error: 'Draft saved but approval status not confirmed. Manual reconciliation required.' }, 503);
      }
      return json({ success:true, id, status:'approved', needsPublish:true, published:false });
    } finally {
      // On validation errors reset the claim. After a successful KV write,
      // leave 'applying' for manual reconciliation instead of reapplying blindly.
      if (!savedDraft) {
        await env.DB.prepare("UPDATE category_change_requests SET status='pending' WHERE id=? AND status='applying'").bind(id).run();
      }
    }
  }

  return json({ error:'Method not allowed' }, 405);
}


/**
 * Production review only. Atomic, revisioned site-config in D1.
 *
 * Enabled ONLY with env.PZ_D1_SITE_CONFIG_ENABLED === 'true' and after
 * explicit ADMIN bootstrap of current KV draft and published config.
 * No Worker deployment or migration implied by adding this file.
 */
const pzD1SiteEnabled = env =>
  String(env.PZ_D1_SITE_CONFIG_ENABLED || '').toLowerCase() === 'true';

const JSON_MAX_BYTES = 512 * 1024;
const parse = raw => { try { return JSON.parse(raw || 'null'); } catch { return null; } };
const isConfig = v => v && typeof v === 'object' && !Array.isArray(v) &&
  Array.isArray(v.categories) && v.categories.every(c=>c&&typeof c.id==='string'&&typeof c.title==='string');
const cleanField = value => String(value == null ? '' : value);
const editableFields = c => ({
  title:cleanField(c?.title), title_cn:cleanField(c?.title_cn || c?.title_zh),
  subtitle:cleanField(c?.subtitle), description:cleanField(c?.description),
  image:cleanField(c?.image)
});
const jsonResponse=(json,obj,status=200)=>json(obj,status);
const stale=(json,msg='Site configuration changed. Refresh and retry.')=>
  json({error:msg,code:'DRAFT_REVISION_CONFLICT'},409);
const dbRow=env=>env.DB.prepare(
  'SELECT * FROM site_config_state WHERE id=1').first();
const sha256=async text=>{
  const bin=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
  return Array.from(new Uint8Array(bin),b=>b.toString(16).padStart(2,'0')).join('');
};
async function readJsonBody(request,json) {
  if(!(request.headers.get('content-type')||'').toLowerCase().includes('application/json'))
    return {error:json({error:'JSON required'},415)};
  const raw=await request.text();
  if(new TextEncoder().encode(raw).byteLength>JSON_MAX_BYTES)
    return {error:json({error:'Request body too large'},413)};
  const value=parse(raw);
  if(!value || typeof value!=='object' || Array.isArray(value))
    return {error:json({error:'Invalid request body'},400)};
  return {value};
}
async function guardedWrite(env,{expectedRevision,nextConfig,token,requestKind,requestId,status='pending'}) {
  const timestamp=new Date().toISOString();
  const update=env.DB.prepare(
    'UPDATE site_config_state SET draft_json=?, draft_revision=draft_revision+1, write_token=?, updated_at=? '+
    'WHERE id=1 AND draft_revision=?'+
    (requestKind ? ' AND EXISTS (SELECT 1 FROM '+(requestKind==='new'?'category_requests':'category_change_requests')+
      ' WHERE id=? AND status=?)' : '')
  ).bind(...(requestKind
    ?[JSON.stringify(nextConfig),token,timestamp,expectedRevision,requestId,status]
    :[JSON.stringify(nextConfig),token,timestamp,expectedRevision]));
  if(!requestKind) {
    const written=await update.run();
    return {ok:written?.meta?.changes===1,revision:expectedRevision+1};
  }
  // D1 batch is a single SQLite transaction. The transition can only
  // complete if the exact write token from our D1 draft mutation matches.
  const table=requestKind==='new'?'category_requests':'category_change_requests';
  const final=env.DB.prepare(
    'UPDATE '+table+" SET status='approved', updated_at=? WHERE id=? AND status=? AND "+
    '(SELECT write_token FROM site_config_state WHERE id=1)=?'
  ).bind(timestamp,requestId,status,token);
  const [saveResult,transitionResult]=await env.DB.batch([update,final]);
  const ok=saveResult?.meta?.changes===1 && transitionResult?.meta?.changes===1;
  if(!ok && saveResult?.meta?.changes===1) {
    throw new Error('Unexpected D1 transaction mismatch; investigate before retrying');
  }
  return {ok,revision:expectedRevision+1};
}
async function requireRow(env,json) {
  const row=await dbRow(env);
  if(!row) return {error:json({error:'D1 site config not bootstrapped; release blocked'},503)};
  const draft=parse(row.draft_json), published=parse(row.published_json);
  if(!isConfig(draft)||!isConfig(published))
    return {error:json({error:'Invalid stored site configuration'},503)};
  return {row,draft,published};
}
async function pzReadPublishedConfig(env) {
  if(!pzD1SiteEnabled(env)) {
    return parse(await env.SITE_CONFIG_KV.get('published:site_config'));
  }
  const row=await dbRow(env);
  return row?parse(row.published_json):null;
}
async function pzReadDraftConfig(env) {
  if(!pzD1SiteEnabled(env)) {
    return parse(await env.SITE_CONFIG_KV.get('draft:site_config'));
  }
  const row=await dbRow(env);
  return row?parse(row.draft_json):null;
}
async function approveNewCategory(env,json,id) {
  const proposal=await env.DB.prepare(
    'SELECT id,title,title_cn,subtitle,image,status FROM category_requests WHERE id=? LIMIT 1'
  ).bind(id).first();
  if(!proposal)return json({error:'Category request not found'},404);
  if(!['pending','awaiting_review'].includes(proposal.status))
    return stale(json,'Only pending category requests may be approved');
  const state=await requireRow(env,json);
  if(state.error)return state.error;
  const {row,draft}=state;
  const slug=cleanField(proposal.title).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||
    ('cat-'+id.slice(0,6));
  if(draft.categories.some(c=>c.id===slug||c.proposal_id===id||c.title.toLowerCase()===proposal.title.toLowerCase()))
    return stale(json,'Category already exists in the draft');
  const next={...draft,categories:[{
    id:slug,title:proposal.title,title_cn:proposal.title_cn||'',
    title_zh:proposal.title_cn||'',subtitle:proposal.subtitle||'',image:proposal.image||'',
    source:'proposal',proposal_id:id,created_at:new Date().toISOString()
  },...draft.categories]};
  const result=await guardedWrite(env,{expectedRevision:row.draft_revision,nextConfig:next,
    token:crypto.randomUUID(),requestKind:'new',requestId:id,status:proposal.status});
  if(!result.ok)return stale(json);
  return json({success:true,id,action:'approve',status:'approved',published:false,
    needsPublish:true,categoryId:slug,draftUpdated:true,revision:result.revision});
}
async function approveCategoryChange(env,json,id) {
  const change=await env.DB.prepare('SELECT * FROM category_change_requests WHERE id=? LIMIT 1')
    .bind(id).first();
  if(!change)return json({error:'Category change request not found'},404);
  if(change.status!=='pending')return stale(json,'Only pending modifications can be approved');
  const state=await requireRow(env,json);
  if(state.error)return state.error;
  const {row,draft,published}=state;
  const old=published.categories.find(c=>c.id===change.category_id);
  const current=draft.categories.find(c=>c.id===change.category_id);
  const base=parse(change.base_json),proposed=parse(change.proposed_json);
  if(!old||!current||!base||!proposed||
     JSON.stringify(editableFields(old))!==JSON.stringify(base)||
     JSON.stringify(editableFields(current))!==JSON.stringify(base))
    return stale(json,'Category data changed since factory submitted the request');
  if(draft.categories.some(c=>c.id!==change.category_id &&
    cleanField(c.title).trim().toLowerCase()===cleanField(proposed.title).trim().toLowerCase()))
    return stale(json,'Proposed category title already exists');
  if(proposed.image && proposed.image!==base.image) {
    const cdn=String(env.PZ_IMAGE_BASE_URL||'').replace(/\/+$/,'');
    if(cdn!=='https://cdn.peng-zhan.com'||!env.PRODUCT_IMAGES)
      return json({error:'Production image configuration unavailable'},503);
    let key;
    try{
      const u=new URL(proposed.image);
      if(u.origin!==cdn||u.search||u.hash||u.username||u.password)
        return json({error:'Invalid Production cover URL'},400);
      key=decodeURIComponent(u.pathname.slice(1));
      if(!/^uploads\/[^/]+$/.test(key)||key.includes('..'))
        return json({error:'Invalid cover key'},400);
    }catch{return json({error:'Invalid cover URL'},400);}
    if(!(await env.PRODUCT_IMAGES.head(key)))return json({error:'Cover missing from Production R2'},400);
  }
  const next={...draft,categories:draft.categories.map(c=>c.id===change.category_id
    ?{...c,...proposed,title_zh:proposed.title_cn}:c)};
  const result=await guardedWrite(env,{expectedRevision:row.draft_revision,nextConfig:next,
    token:crypto.randomUUID(),requestKind:'change',requestId:id});
  if(!result.ok)return stale(json);
  return json({success:true,id,status:'approved',published:false,
    needsPublish:true,revision:result.revision});
}
const categoryNewApprove=/^\/admin\/category[-_]requests\/([^/]+)\/approve$/;
const categoryChangeApprove=/^\/admin\/category-change-requests\/([^/]+)\/approve$/;
const protectedRoutes=new Set(['/admin/draft/site-config','/site-config','/admin/publish',
  '/admin/rollback','/admin/preview/site-config','/api/site-config']);
const reconcileChange=/^\/admin\/category-change-requests\/([^/]+)\/reconcile$/;
const unsafeLegacyApprovals=path=>categoryNewApprove.test(path)||
  categoryChangeApprove.test(path)||reconcileChange.test(path);
async function handleD1SiteConfig({request,env,pathname,authorize,json,publishTransform}) {
  const boot='/admin/site-config/bootstrap';
  const isBootstrap=pathname===boot;
  // Pages /api/site-config/meta maps to /site-config/meta on the Worker.
  const isPublicMeta=pathname==='/site-config/meta'||pathname==='/api/site-config/meta';
  if(!isBootstrap&&!isPublicMeta&&!protectedRoutes.has(pathname)&&!unsafeLegacyApprovals(pathname))return null;
  if(String(env.PZ_RUNTIME_ENV||'').toLowerCase()!=='production')
    return isBootstrap?json({error:'Production only'},403):null;
  const active=pzD1SiteEnabled(env);
  // FactoryWorkspace polls this public version endpoint. Use the same
  // authority as GET /api/site-config in both cutover states.
  if(isPublicMeta&&request.method==='GET') {
    if(!active) {
      const raw=await env.SITE_CONFIG_KV.get('published:meta');
      const metadata=parse(raw);
      if(metadata&&typeof metadata==='object'&&!Array.isArray(metadata)&&
         typeof metadata.version==='string'&&metadata.version.trim())
        return json({version:metadata.version,
          publishedAt:metadata.publishedAt||metadata.published_at||null,
          source:'kv-meta'});
      // KV may temporarily return a cached miss after a key rename.
      // Do NOT return a meaningless null version: the factory's refresh
      // polling depends on a stable, content-sensitive version marker.
      // Use only the existing published snapshot, never mutate KV.
      const publishedRaw=await env.SITE_CONFIG_KV.get('published:site_config');
      const published=parse(publishedRaw);
      if(!isConfig(published))
        return json({error:'Published KV site configuration unavailable',
          code:'SITE_CONFIG_META_AND_CONTENT_UNAVAILABLE'},503);
      const fingerprint=await sha256(publishedRaw);
      return json({version:'kv-sha256-'+fingerprint,
        publishedAt:null,source:'kv-published-content-fallback',
        metaStatus:raw===null?'kv-read-null':'kv-invalid-or-incomplete'});
    }
    const state=await requireRow(env,json);
    if(state.error)return state.error;
    return json({version:state.row.published_version,publishedAt:state.row.published_at,
      publishedRevision:state.row.published_revision});
  }
  if(!active&&!isBootstrap) {
    // Keep existing new-category approval available during the short opt-in
    // window. Only the newly introduced modification approval/reconciliation
    // requires a bootstrapped D1 state.
    return categoryChangeApprove.test(pathname)||reconcileChange.test(pathname)
      ?json({error:'D1 category changes are not activated'},503)
      :null;
  }
  if(!isBootstrap&&pathname==='/api/site-config'&&request.method==='GET') {
    const state=await requireRow(env,json);
    if(state.error)return state.error;
    return json({config:state.published});
  }
  const auth=await authorize(request,env,['ADMIN']);
  if(auth instanceof Response)return auth;
  if(isBootstrap) {
    if(active) return json({error:'Turn off bootstrap after D1 cutover'},409);
    const old=await dbRow(env);
    if(old)return json({error:'D1 site configuration already initialized'},409);
    const [draftRaw,publishedRaw,metaRaw]=await Promise.all([
      env.SITE_CONFIG_KV.get('draft:site_config'),
      env.SITE_CONFIG_KV.get('published:site_config'),
      env.SITE_CONFIG_KV.get('published:meta')
    ]);
    const draft=parse(draftRaw),published=parse(publishedRaw),meta=parse(metaRaw)||{};
    if(!isConfig(draft)||!isConfig(published))
      return json({error:'Existing KV site configuration missing or invalid'},503);
    const draftSha=await sha256(draftRaw),publishedSha=await sha256(publishedRaw);
    if(request.method==='GET')
      return json({ready:true,draftSha,publishedSha,
        draftCategories:draft.categories.length,publishedCategories:published.categories.length});
    if(request.method==='POST'){
      const body=await readJsonBody(request,json);
      if(body.error)return body.error;
      if(body.value.draftSha!==draftSha||body.value.publishedSha!==publishedSha)
        return stale(json,'KV values changed since bootstrap preflight');
      // Preserve the pre-cutover public version *before* the D1 cutover.
      // A D1 bootstrap without this R2 snapshot could not roll back to the
      // last published KV site after the very first D1-backed publish.
      if(!env.SITE_CONFIG_HISTORY ||
         typeof env.SITE_CONFIG_HISTORY.put!=='function' ||
         typeof env.SITE_CONFIG_HISTORY.get!=='function')
        return json({error:'Site config history R2 binding required for safe cutover'},503);
      const bootstrapVersion='bootstrap-'+publishedSha;
      const snapshotKey='snapshots/site_config/'+bootstrapVersion+'.json';
      const preexisting=await env.SITE_CONFIG_HISTORY.get(snapshotKey);
      if(preexisting) {
        if(await preexisting.text()!==publishedRaw)
          return stale(json,'Bootstrap R2 snapshot conflicts with current KV published content');
      }else{
        await env.SITE_CONFIG_HISTORY.put(snapshotKey,publishedRaw,{
          httpMetadata:{contentType:'application/json'}
        });
      }
      const verified=await env.SITE_CONFIG_HISTORY.get(snapshotKey);
      if(!verified || await verified.text()!==publishedRaw)
        return json({error:'Bootstrap snapshot was not verified in R2; D1 untouched'},503);
      const timestamp=new Date().toISOString();
      const installed=await env.DB.prepare(
        'INSERT OR IGNORE INTO site_config_state (id,draft_json,draft_revision,published_json,'+
        'published_revision,published_version,published_at,write_token,updated_at) '+
        'VALUES(1,?,1,?,1,?,?,?,?)'
      ).bind(draftRaw,publishedRaw,bootstrapVersion,
        String(meta.publishedAt||timestamp),crypto.randomUUID(),timestamp).run();
      if(installed?.meta?.changes!==1)return stale(json,'Site config bootstrapped by another request');
      return json({success:true,revision:1,draftSha,publishedSha,
        publishedVersion:bootstrapVersion,initialSnapshotVerified:true});
    }
    return json({error:'Method not allowed'},405);
  }
  const state=await requireRow(env,json);
  if(state.error)return state.error;
  const {row,draft,published}=state;
  if(pathname==='/admin/draft/site-config'&&request.method==='GET')
    return json({draft,revision:row.draft_revision});
  if(pathname==='/admin/preview/site-config'&&request.method==='GET')
    return json({preview:publishTransform(draft,env),revision:row.draft_revision});
  if(pathname==='/site-config'&&request.method==='PUT'){
    const body=await readJsonBody(request,json);
    if(body.error)return body.error;
    if(!Number.isSafeInteger(body.value.revision)||body.value.revision<1)
      return json({error:'Draft revision required; refresh the editor'},428);
    const config=body.value.config;
    if(!isConfig(config))return json({error:'Valid site config with categories required'},400);
    const result=await guardedWrite(env,{expectedRevision:body.value.revision,
      nextConfig:config,token:crypto.randomUUID()});
    if(!result.ok)return stale(json);
    return json({success:true,draft:true,revision:result.revision});
  }
  const newMatch=pathname.match(categoryNewApprove);
  if(newMatch&&request.method==='POST')return approveNewCategory(env,json,newMatch[1]);
  const changeMatch=pathname.match(categoryChangeApprove);
  if(changeMatch&&request.method==='POST')return approveCategoryChange(env,json,changeMatch[1]);
  if(reconcileChange.test(pathname)&&request.method==='POST') {
    // Under D1 transactional approvals there is no split KV/D1 'applying'
    // step, so the legacy KV-based repair route must not execute.
    return json({error:'Legacy KV reconciliation disabled under D1 mode'},409);
  }
  if(pathname==='/admin/publish'&&request.method==='POST') {
    const body=await readJsonBody(request,json);
    if(body.error)return body.error;
    const rev=body.value.revision;
    if(!Number.isSafeInteger(rev)||rev<1)return json({error:'Draft revision required'},428);
    if(row.draft_revision!==rev)return stale(json);
    const snapshot=publishTransform(draft,env);
    if(!isConfig(snapshot))return json({error:'Invalid publish snapshot'},503);
    const version=String(Date.now())+'-'+crypto.randomUUID();
    const publishedAt=new Date().toISOString();
    // R2 snapshot first. A failed D1 CAS can leave an orphan R2 object,
    // which is safe; no public change is made.
    if(!env.SITE_CONFIG_HISTORY)return json({error:'R2 history binding missing'},503);
    await env.SITE_CONFIG_HISTORY.put('snapshots/site_config/'+version+'.json',
      JSON.stringify(snapshot),{httpMetadata:{contentType:'application/json'}});
    const saved=await env.DB.prepare(
      'UPDATE site_config_state SET published_json=?, published_revision=published_revision+1,'+
      'published_version=?, published_at=?, updated_at=? '+
      'WHERE id=1 AND draft_revision=? AND published_revision=?'
    ).bind(JSON.stringify(snapshot),version,publishedAt,publishedAt,rev,row.published_revision).run();
    if(saved?.meta?.changes!==1)return stale(json,'Published or draft version changed during review');
    return json({success:true,version,publishedAt,revision:rev});
  }
  if(pathname==='/admin/rollback'&&request.method==='POST'){
    const body=await readJsonBody(request,json);
    if(body.error)return body.error;
    const version=cleanField(body.value.version).trim();
    const priorRev=body.value.publishedRevision;
    if(!version||!Number.isSafeInteger(priorRev))return json({error:'Version and publishedRevision required'},428);
    if(!env.SITE_CONFIG_HISTORY)return json({error:'R2 history unavailable'},503);
    const obj=await env.SITE_CONFIG_HISTORY.get('snapshots/site_config/'+version+'.json');
    if(!obj)return json({error:'Snapshot not found'},404);
    const snapshot=parse(await obj.text());
    if(!isConfig(snapshot))return json({error:'Invalid snapshot'},500);
    const now=new Date().toISOString();
    const saved=await env.DB.prepare(
      'UPDATE site_config_state SET published_json=?,published_revision=published_revision+1,'+
      'published_version=?,published_at=?,updated_at=? WHERE id=1 AND published_revision=?'
    ).bind(JSON.stringify(snapshot),version,now,now,priorRev).run();
    if(saved?.meta?.changes!==1)return stale(json,'Published revision changed; rollback aborted');
    return json({success:true,version,rolledAt:now});
  }
  return json({error:'Method not allowed'},405);
}


var index_default = {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (request.method === "OPTIONS") {
      return corsPreflight();
    }
    try {
      const siteStateResponse = await handleD1SiteConfig({
        request, env, pathname, authorize, json, publishTransform
      });
      if (siteStateResponse) return siteStateResponse;
      if (pathname === "/inquiries" && request.method === "POST") {
        if (!(request.headers.get("content-type") || "").toLowerCase().includes("application/json")) {
          return json({ error: "Expected JSON" }, 415);
        }
        const text = await request.text();
        if (new TextEncoder().encode(text).length > 32768) return json({ error: "Request too large" }, 413);
        let body;
        try {
          body = JSON.parse(text);
        } catch {
          return badRequest("Invalid JSON");
        }
        if (!body || typeof body !== "object" || Array.isArray(body)) return badRequest("Invalid request");
        const limits = { name: 200, email: 254, company: 300, product_type: 100, message: 1e4, website: 2048, turnstileToken: 2048 };
        const input = {};
        for (const [key, max] of Object.entries(limits)) {
          if (body[key] != null && typeof body[key] !== "string") return badRequest("Invalid field: " + key);
          input[key] = (body[key] || "").trim();
          if (input[key].length > max) return badRequest("Field too long: " + key);
        }
        if (!input.name || !input.message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) return badRequest("Name, valid email and message are required");
        if (!input.turnstileToken) return badRequest("Security verification required");
        if (!env.TURNSTILE_SECRET) return json({ error: "Security verification unavailable" }, 503);
        let verification;
        try {
          const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ secret: env.TURNSTILE_SECRET, response: input.turnstileToken }),
            signal: AbortSignal.timeout(1e4)
          });
          if (!response.ok) return json({ error: "Security verification unavailable" }, 503);
          verification = await response.json();
        } catch {
          return json({ error: "Security verification unavailable" }, 503);
        }
        if (verification?.success !== true) return badRequest("Security verification failed or expired");
        const allowedHosts = String(env.TURNSTILE_ALLOWED_HOSTNAMES || "peng-zhan.com,www.peng-zhan.com,pz-website-lw7.pages.dev").split(",").map((h) => h.trim().toLowerCase()).filter(Boolean);
        if (!allowedHosts.includes(String(verification.hostname || "").toLowerCase())) return badRequest("Invalid verification hostname");
        const id = crypto.randomUUID();
        const createdAt = (/* @__PURE__ */ new Date()).toISOString();
        await env.DB.prepare(
          "INSERT INTO inquiries (id, name, email, company, product_type, message, source, created_at, status, website) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(id, input.name, input.email, input.company, input.product_type || "General", input.message, "website", createdAt, "New", input.website).run();
        return json({ success: true, id }, 201);
      }
      if (pathname === "/login" && request.method === "POST") {
        if (!(request.headers.get("content-type") || "").toLowerCase().includes("application/json")) {
          return json({ error: "Expected JSON" }, 415);
        }
        const raw = await request.text();
        if (new TextEncoder().encode(raw).length > 8192) return json({ error: "Request too large" }, 413);
        const body = safeJsonParse(raw, null);
        if (!body || typeof body !== "object" || Array.isArray(body)) return badRequest("Invalid JSON");
        const username = String(body.username ?? "").trim();
        const password = typeof body.password === "string" ? body.password : "";
        if (!username || !password || username.length > 128 || password.length > 256) {
          return badRequest("Invalid credentials");
        }
        const rateKey = await pzAuthLoginRateKey(request, username);
        if (await pzAuthLoginTooMany(env, rateKey)) {
          return json({ error: "Too many login attempts; try again in 10 minutes" }, 429);
        }
        const row = await env.DB.prepare(
          `SELECT id, username, password_hash, role, is_active, org_id
     FROM users
     WHERE username = ?
     LIMIT 1`
        ).bind(username).first();
        const ok = row && Number(row.is_active) === 1
          ? await compare(password, row.password_hash) : false;
        if (!ok) {
          await pzAuthLoginFailure(env, rateKey);
          return json({ error: "Invalid credentials" }, 401);
        }
        const role = await pzOrgEffectiveRole(env, row.id, row.role);
        if (!role) return json({ error: "Forbidden account role" }, 403);
        const token = await signToken(
          {
            sub: row.id,
            username: row.username,
            role,
            org_id: row.org_id ?? null,
            phv: await pzAuthPasswordVersion(row.password_hash)
          },
          env.JWT_SECRET
        );
        // Successful authentication clears this client's failed-attempt counter.
        await env.SITE_CONFIG_KV.delete(rateKey);
        return json({
          token,
          user: {
            id: row.id,
            username: row.username,
            role,
            org_id: row.org_id ?? null
          }
        });
      }
      if (pathname === "/admin/draft/site-config" && request.method === "GET") {
        const auth = await authorize(request, env, ["ADMIN"]);
        if (auth instanceof Response) return auth;
        const raw = await env.SITE_CONFIG_KV.get("draft:site_config");
        return json({ draft: safeJsonParse(raw, {}) });
      }
      if (pathname === "/site-config" && request.method === "PUT") {
        const auth = await authorize(request, env, ["ADMIN"]);
        if (auth instanceof Response) return auth;
        const body = await request.json();
        await env.SITE_CONFIG_KV.put("draft:site_config", JSON.stringify(body));
        return json({ success: true, draft: true });
      }
      if (pathname === "/admin/publish" && request.method === "POST") {
        const auth = await authorize(request, env, ["ADMIN"]);
        if (auth instanceof Response) return auth;
        const draftRaw = await env.SITE_CONFIG_KV.get("draft:site_config");
        const draft = safeJsonParse(draftRaw, {});
        const snapshot = publishTransform(draft, env);
        const version = String(Date.now());
        const publishedAt = (/* @__PURE__ */ new Date()).toISOString();
        await env.SITE_CONFIG_KV.put("published:site_config", JSON.stringify(snapshot));
        await env.SITE_CONFIG_KV.put("published:meta", JSON.stringify({ version, publishedAt }));
        return json({ success: true, version, publishedAt });
      }
      if (pathname === "/admin/rollback" && request.method === "POST") {
        const auth = await authorize(request, env, ["ADMIN"]);
        if (auth instanceof Response) return auth;
        const body = await request.json();
        if (!body.version) return json({ error: "Missing version" }, 400);
        const key = `snapshots/site_config/${body.version}.json`;
        const obj = await env.SITE_CONFIG_HISTORY.get(key);
        if (!obj) return json({ error: "Snapshot not found" }, 404);
        const snapshotText = await obj.text();
        let snapshot;
        try {
          snapshot = JSON.parse(snapshotText);
        } catch {
          return json({ error: "Invalid snapshot data" }, 500);
        }
        await env.SITE_CONFIG_KV.put("published:site_config", JSON.stringify(snapshot));
        const rolledAt = (/* @__PURE__ */ new Date()).toISOString();
        await env.SITE_CONFIG_KV.put(
          "published:meta",
          JSON.stringify({ version: body.version, rolledAt, rollback: true })
        );
        return json({ success: true, version: body.version, rolledAt });
      }
      if (pathname === "/admin/preview/site-config" && request.method === "GET") {
        const auth = await authorize(request, env, ["ADMIN"]);
        if (auth instanceof Response) return auth;
        const draftRaw = await env.SITE_CONFIG_KV.get("draft:site_config");
        if (!draftRaw) return json({ error: "No draft to preview" }, 400);
        const draft = safeJsonParse(draftRaw, {});
        const preview = publishTransform(draft, env);
        return json({ preview });
      }
      if (pathname === "/api/site-config" && request.method === "GET") {
        const raw = await env.SITE_CONFIG_KV.get("published:site_config");
        return new Response(
          JSON.stringify({ config: safeJsonParse(raw, {}) }),
          {
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store"
            }
          }
        );
      }
      if (pathname === "/public/products" && request.method === "GET") {
        if (new URL(request.url).searchParams.get("v") === "2" && env.PZ_CATALOG_V2_ENABLED === "true") {
          return await pzHandlePublicProductsD1(request, env);
        }
        const raw = await env.SITE_CONFIG_KV.get("published:products");
        if (!raw) return json({ items: [] });
        return json(safeJsonParse(raw, { items: [] }));
      }
      if (pathname === "/admin/publish/products" && request.method === "POST") {
        const auth = await authorize(request, env, ["ADMIN"]);
        if (auth instanceof Response) return auth;
        const rows = await env.DB.prepare(`
    SELECT id, name, name_cn, category, sub_category, material, size, finish, code,
           description, description_cn, images, production_sites, status, created_at, updated_at
    FROM products
    WHERE lower(status) = 'published'
    ORDER BY updated_at DESC
  `).all();
        const items = normalizeProductRows(rows.results);
        const version = String(Date.now());
        const publishedAt = (/* @__PURE__ */ new Date()).toISOString();
        await env.SITE_CONFIG_KV.put("published:products", JSON.stringify({ items }));
        await env.SITE_CONFIG_KV.put(
          "published:products:meta",
          JSON.stringify({ version, publishedAt, count: items.length })
        );
        try {
          await env.SITE_CONFIG_HISTORY.put(
            `snapshots/products/${version}.json`,
            JSON.stringify({ items }),
            { httpMetadata: { contentType: "application/json" } }
          );
        } catch (e) {
          console.warn("Products history write failed (ignored)", e);
        }
        return json({ success: true, version, publishedAt, count: items.length });
      }
      if (pathname === "/admin/products" && request.method === "GET") {
        const auth = await authorize(request, env, ["ADMIN"]);
        if (auth instanceof Response) return auth;
        const url = new URL(request.url);
        const limit = Math.min(Number(url.searchParams.get("limit") ?? "500") || 500, 1e3);
        const status = (url.searchParams.get("status") ?? "").trim().toLowerCase();
        let sql = `
    SELECT id, name, name_cn, category, sub_category, material, size, finish, code,
           description, description_cn, images, production_sites, created_by, status, created_at, updated_at
    FROM products
  `;
        const binds = [];
        if (status) {
          sql += ` WHERE lower(status) = ? `;
          binds.push(status);
        }
        sql += ` ORDER BY updated_at DESC LIMIT ? `;
        binds.push(limit);
        const rows = await env.DB.prepare(sql).bind(...binds).all();
        const products = normalizeProductRows(rows.results);
        return json({ products, items: products });
      }
      if (pathname === "/admin/products" && request.method === "POST") {
        const auth = await authorize(request, env, ["ADMIN"]);
        if (auth instanceof Response) return auth;
        const body = await request.json();
        const db = coerceProductForDb(body);
        if (db.production_sites_error) return badRequest(db.production_sites_error);
        const skuError = pzSkuValidationError(db.code, true);
        if (skuError) return badRequest(skuError);
        const id = crypto.randomUUID();
        const now = (/* @__PURE__ */ new Date()).toISOString();
        await env.DB.prepare(
          `INSERT INTO products
      (id, name, name_cn, category, sub_category, material, size, finish, code,
       description, description_cn, images, status, created_at, updated_at,
       production_sites, org_id, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          id,
          db.name,
          db.name_cn,
          db.category,
          db.sub_category,
          db.material,
          db.size,
          db.finish,
          db.code,
          db.description,
          db.description_cn,
          db.images_json,
          db.status,
          now,
          now,
          db.production_sites_json ?? "[]",
          "org-main",
          auth.user.id
        ).run();
        return json({ success: true, id });
      }
      if (pathname.startsWith("/admin/products/") && request.method === "PUT") {
        const auth = await authorize(request, env, ["ADMIN"]);
        if (auth instanceof Response) return auth;
        const id = pathname.replace("/admin/products/", "").trim();
        if (!id) return badRequest("Missing product id");
        const body = await request.json();
        const db = coerceProductForDb(body);
        if (db.production_sites_error) return badRequest(db.production_sites_error);
        const skuError = pzSkuValidationError(db.code);
        if (skuError) return badRequest(skuError);
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const result = await env.DB.prepare(
          `UPDATE products SET
        name = ?,
        name_cn = ?,
        category = ?,
        sub_category = ?,
        material = ?,
        size = ?,
        finish = ?,
        code = ?,
        description = ?,
        description_cn = ?,
        images = ?,
        production_sites = COALESCE(?, production_sites),
        status = ?,
        updated_at = ?
     WHERE id = ?`
        ).bind(
          db.name,
          db.name_cn,
          db.category,
          db.sub_category,
          db.material,
          db.size,
          db.finish,
          db.code,
          db.description,
          db.description_cn,
          db.images_json,
          db.production_sites_json,
          db.status,
          now,
          id
        ).run();
        if (!result.meta || result.meta.changes !== 1) {
          return json({ error: "Product not found" }, 404);
        }
        return json({ success: true, publicCatalog: "d1-v2" });
      }
      // Production change request workflow. Never publishes directly.
      const categoryChangeResponse = await handleProductionCategoryChanges({
        request, env, pathname, authorize, json, badRequest
      });
      if (categoryChangeResponse) return categoryChangeResponse;

      if (pathname === "/admin/category-requests" && request.method === "GET") {
        const auth = await authorize(request, env, ["ADMIN"]);
        if (auth instanceof Response) return auth;
        const url = new URL(request.url);
        const status = (url.searchParams.get("status") ?? "").trim();
        const sql = status ? `SELECT * FROM category_requests WHERE status = ? ORDER BY updated_at DESC` : `SELECT * FROM category_requests ORDER BY updated_at DESC`;
        const stmt = env.DB.prepare(sql);
        const rows = status ? await stmt.bind(status).all() : await stmt.all();
        return json({ items: rows.results ?? [] });
      }
      if (pathname.startsWith("/admin/products/") && request.method === "DELETE") {
        const auth = await authorize(request, env, ["ADMIN"]);
        if (auth instanceof Response) return auth;
        const id = pathname.replace("/admin/products/", "").trim();
        if (!id) return badRequest("Missing product id");
        await env.DB.prepare(`DELETE FROM products WHERE id = ?`).bind(id).run();
        return json({ success: true });
      }
      if (pathname === "/factory/products/check-skus" && request.method === "POST") {
        const auth = await authorize(request, env, ["FACTORY", "ADMIN"]);
        if (auth instanceof Response) return auth;
        const body = await request.json();
        if (!Array.isArray(body?.codes) || body.codes.length < 1 || body.codes.length > 30 || !body.codes.every((code) => typeof code === "string")) {
          return badRequest("Supply 1-30 SKU codes.");
        }
        const codes = [...new Set(body.codes.map((code) => code.trim().toUpperCase()))];
        if (codes.some((code) => pzSkuValidationError(code, true))) {
          return badRequest("Invalid SKU in lookup.");
        }
        const params = codes.map(() => "?").join(",");
        const rows = await env.DB.prepare(
          `SELECT UPPER(TRIM(code)) AS code FROM products
           WHERE code IS NOT NULL AND TRIM(code) <> ''
           AND UPPER(TRIM(code)) IN (${params}) LIMIT 30`
        ).bind(...codes).all();
        return json({ existingCodes: (rows.results || []).map((row) => row.code) });
      }

if (
  pathname === "/factory/category-requests" &&
  request.method === "POST"
) {
  if (env.PZ_RUNTIME_ENV !== "production") {
    return json({ error: "Production only" }, 503);
  }

  const auth = await authorize(request, env, ["FACTORY", "ADMIN"]);
  if (auth instanceof Response) return auth;

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return badRequest("Invalid request body");
  }

  const title = String(body.title ?? "").trim();
  const titleCn = String(body.title_cn ?? "").trim();
  const subtitle = String(body.subtitle ?? "").trim();
  const image = String(body.image ?? "").trim();

  if (!title || !titleCn) {
    return badRequest("Missing category title");
  }

  if (
    title.length > 120 ||
    titleCn.length > 120 ||
    subtitle.length > 500 ||
    image.length > 2048
  ) {
    return badRequest("Invalid field length");
  }

  // Only allow references to the Production CDN.
  if (image) {
    let url;
    try {
      url = new URL(image);
    } catch {
      return badRequest("Invalid image URL");
    }

    if (
      url.protocol !== "https:" ||
      url.hostname !== "cdn.peng-zhan.com" ||
      url.port ||
      url.username ||
      url.password
    ) {
      return badRequest("Production image URL required");
    }
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await env.DB.prepare(`
    INSERT INTO category_requests
      (id, title, title_cn, subtitle, image,
       status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
  `).bind(
    id, title, titleCn, subtitle, image, now, now
  ).run();

  return json({
    success: true,
    id,
    status: "pending"
  }, 201);
}

      if (pathname === "/factory/products" && request.method === "GET") {
        const auth = await authorize(request, env, ["FACTORY", "ADMIN"]);
        if (auth instanceof Response) return auth;
        const scoped = env.PZ_ORG_RBAC_ENABLED === "true" && auth.user.role === "FACTORY";
        if (scoped && !(await pzOrgCanManageProduct(env, auth.user.id))) return json({error:"Team assignment required"},403);
        const url = new URL(request.url);
        const limit = Math.min(Number(url.searchParams.get("limit") ?? "500") || 500, 1e3);
        const rows = await env.DB.prepare(
          `SELECT id, name, name_cn, category, sub_category, material, size, finish, code,
            description, description_cn, images, production_sites, created_by, status, created_at, updated_at
     FROM products
     ${scoped ? 'WHERE created_by = ?' : ''}
     ORDER BY updated_at DESC
     LIMIT ?`
        ).bind(...(scoped ? [auth.user.id,limit] : [limit])).all();
        const items = normalizeProductRows(rows.results);
        return json({ items, products: items });
      }
      if (pathname === "/factory/products" && request.method === "POST") {
        const auth = await authorize(request, env, ["FACTORY", "ADMIN"]);
        if (auth instanceof Response) return auth;
        if (env.PZ_ORG_RBAC_ENABLED === "true" && auth.user.role === "FACTORY" && !(await pzOrgCanManageProduct(env, auth.user.id, null))) return json({error:"Product ownership or assignment required"},403);
        const body = await request.json();
        const db = coerceProductForDb(body);
        if (db.production_sites_error) return badRequest(db.production_sites_error);
        const skuError = pzSkuValidationError(db.code, true);
        if (skuError) return badRequest(skuError);
        const id = crypto.randomUUID();
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const status = "draft";
        await env.DB.prepare(
          `INSERT INTO products
      (id, name, name_cn, category, sub_category, material, size, finish, code,
       description, description_cn, images, status, created_at, updated_at,
       production_sites, org_id, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          id,
          db.name,
          db.name_cn,
          db.category,
          db.sub_category,
          db.material,
          db.size,
          db.finish,
          db.code,
          db.description,
          db.description_cn,
          db.images_json,
          status,
          now,
          now,
          db.production_sites_json ?? "[]",
          "org-main",
          auth.user.id
        ).run();
        return json({ success: true, id, status });
      }
      {
        const m = pathname.match(/^\/factory\/products\/([^/]+)\/submit$/);
        if (m && request.method === "POST") {
          const auth = await authorize(request, env, ["FACTORY", "ADMIN"]);
          if (auth instanceof Response) return auth;
          const id = m[1].trim();
          if (env.PZ_ORG_RBAC_ENABLED === "true" && auth.user.role === "FACTORY" && !(await pzOrgCanManageProduct(env, auth.user.id, id))) return json({error:"Product ownership or assignment required"},403);
          if (!id) return badRequest("Missing product id");
          const now = (/* @__PURE__ */ new Date()).toISOString();
          const result = await env.DB.prepare(
            `UPDATE products
       SET status = ?, updated_at = ?
       WHERE id = ? AND lower(status) IN ('draft','rejected','returned_to_uploader')`
          ).bind("awaiting_review", now, id).run();
          if (!result.meta || result.meta.changes !== 1) {
            return json({ error: "Only draft or rejected products can be submitted" }, 409);
          }
          return json({ success: true, id, status: "awaiting_review" });
        }
      }
      {
        const m = pathname.match(/^\/factory\/products\/([^/]+)$/);
        if (m && request.method === "PUT") {
          const auth = await authorize(request, env, ["FACTORY", "ADMIN"]);
          if (auth instanceof Response) return auth;
          const id = m[1].trim();
          if (env.PZ_ORG_RBAC_ENABLED === "true" && auth.user.role === "FACTORY" && !(await pzOrgCanManageProduct(env, auth.user.id, id))) return json({error:"Product ownership or assignment required"},403);
          if (!id) return badRequest("Missing product id");
          const body = await request.json();
          const db = coerceProductForDb(body);
          if (db.production_sites_error) return badRequest(db.production_sites_error);
          const skuError = pzSkuValidationError(db.code);
          if (skuError) return badRequest(skuError);
          const now = (/* @__PURE__ */ new Date()).toISOString();
          const result = await env.DB.prepare(
            `UPDATE products SET
          name = ?,
          name_cn = ?,
          category = ?,
          sub_category = ?,
          material = ?,
          size = ?,
        finish = ?,
          code = ?,
          description = ?,
          description_cn = ?,
          images = ?,
          production_sites = COALESCE(?, production_sites),
          updated_at = ?
       WHERE id = ? AND lower(status) IN ('draft','rejected')`
          ).bind(
            db.name,
            db.name_cn,
            db.category,
            db.sub_category,
            db.material,
            db.size,
          db.finish,
            db.code,
            db.description,
            db.description_cn,
            db.images_json,
            db.production_sites_json,
            now,
            id
          ).run();
          if (!result.meta || result.meta.changes !== 1) {
            return json({ error: "Only draft or rejected products are editable by factory" }, 409);
          }
          return json({ success: true, id });
        }
      }
      // Admin-only catalog documents: keep the existing image upload route image-only.
      // PDF upload creates an R2 object, but never changes the published catalog URL.
      if (pathname === "/admin/upload-pdf" && request.method === "POST") {
        const auth = await authorize(request, env, ["ADMIN"]);
        if (auth instanceof Response) return auth;
        const fileBase = pzConfiguredImageBase(env);
        if (!fileBase || !env.PRODUCT_IMAGES) return json({ error: "Catalog storage is not configured" }, 503);
        const contentType = request.headers.get("content-type") || "";
        if (!contentType.toLowerCase().includes("multipart/form-data")) {
          return json({ error: "Expected multipart/form-data" }, 400);
        }
        const form = await request.formData();
        const file = form.get("file");
        if (!(file instanceof File)) return json({ error: "Missing PDF file" }, 400);
        const MAX_PDF_BYTES = 15 * 1024 * 1024;
        if (file.size < 8 || file.size > MAX_PDF_BYTES) {
          return json({ error: "PDF size must be 15 MB or less" }, 413);
        }
        if (!/\.pdf$/i.test(file.name) || (file.type && file.type !== "application/pdf")) {
          return json({ error: "Only PDF files are accepted" }, 415);
        }
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        // Validate file signature, not merely extension or client-supplied MIME.
        if (bytes[0] !== 37 || bytes[1] !== 80 || bytes[2] !== 68 || bytes[3] !== 70 || bytes[4] !== 45) {
          return json({ error: "Invalid PDF signature" }, 415);
        }
        const basename = file.name.slice(0, -4).toLowerCase()
          .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "catalog";
        const key = `catalogs/${Date.now()}-${crypto.randomUUID()}-${basename}.pdf`;
        await env.PRODUCT_IMAGES.put(key, buffer, {
          httpMetadata: { contentType: "application/pdf", contentDisposition: "inline" }
        });
        return json({ success: true, key, url: `${fileBase}/${encodeURIComponent(key)}` });
      }
      if (pathname === "/upload-image" && request.method === "POST") {
        const auth = await authorize(request, env, ["ADMIN", "FACTORY"]);
        if (auth instanceof Response) return auth;
        const imageBase = pzConfiguredImageBase(env);
        if (!imageBase) return json({ error: "Image host/environment is not configured; uploads are disabled" }, 503);
        const contentType = request.headers.get("content-type") || "";
        if (!contentType.includes("multipart/form-data")) {
          return json({ error: "Expected multipart/form-data" }, 400);
        }
        const form = await request.formData();
        const file = form.get("file");
        if (!(file instanceof File)) {
          return json({ error: "Missing file" }, 400);
        }
        const MAX_BYTES = 15 * 1024 * 1024;
        if (file.size > MAX_BYTES) {
          return json({ error: "File too large" }, 413);
        }
        const buffer = await file.arrayBuffer();
        const detectedType = pzDetectedImageContentType(new Uint8Array(buffer));
        if (!detectedType || file.type && file.type !== detectedType) {
          return json({ error: "Only valid JPEG, PNG or WebP images are accepted" }, 415);
        }
        const original = file.name || "upload";
        const dot = original.lastIndexOf(".");
        const base = (dot >= 0 ? original.slice(0, dot) : original).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "file";
        const ext = detectedType === "image/jpeg" ? ".jpg" : detectedType === "image/png" ? ".png" : ".webp";
        const key = `uploads/${Date.now()}-${crypto.randomUUID()}-${base}${ext}`;
        await env.PRODUCT_IMAGES.put(key, buffer, { httpMetadata: { contentType: detectedType } });
        const url = `${imageBase}/${encodeURIComponent(key)}`;
        return json({ success: true, key, url });
      }
      {
        const match = pathname.match(/^\/admin\/category[-_]requests\/([^/]+)\/approve$/);
        if (match && request.method === "POST") {
          const auth = await authorize(request, env, ["ADMIN"]);
          if (auth instanceof Response) return auth;
          const id = match[1].trim();
          const nowIso = new Date().toISOString();
          const proposal = await env.DB.prepare(
            "SELECT id, title, title_cn, subtitle, image, status FROM category_requests WHERE id = ? LIMIT 1"
          ).bind(id).first();
          if (!proposal) return json({ error: "Category proposal not found" }, 404);
          if (proposal.status !== "pending" && proposal.status !== "awaiting_review") {
            return json({ error: "Only pending category requests can be approved" }, 409);
          }
          const draftRaw = await env.SITE_CONFIG_KV.get("draft:site_config");
          const draft = safeJsonParse(draftRaw, null);
          if (!draft || !Array.isArray(draft.categories)) {
            return json({ error: "Draft category registry unavailable" }, 503);
          }
          const slug = String(proposal.title || "").toLowerCase().trim()
            .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "cat-" + id.slice(0, 6);
          if (draft.categories.some(c => c.id === slug || c.proposal_id === id)) {
            return json({ error: "Category already exists in draft", code: "CATEGORY_CONFLICT" }, 409);
          }
          const newCategory = {
            id: slug, title: proposal.title, title_cn: proposal.title_cn || "",
            title_zh: proposal.title_cn || "", subtitle: proposal.subtitle || "",
            image: proposal.image || "", source: "proposal", proposal_id: id,
            created_at: nowIso
          };
          draft.categories = [newCategory, ...draft.categories];
          await env.SITE_CONFIG_KV.put("draft:site_config", JSON.stringify(draft));
          const updated = await env.DB.prepare(
            "UPDATE category_requests SET status='approved', updated_at=? WHERE id=? AND status IN ('pending','awaiting_review')"
          ).bind(nowIso, id).run();
          if (updated?.meta?.changes !== 1) {
            return json({ error: "Draft saved but approval not confirmed; reconcile manually" }, 503);
          }
          return json({
            success: true, id, action: "approve", status: "approved",
            published: false, needsPublish: true,
            categoryId: slug, draftUpdated: true
          });
        }
      }
      {
        const m = pathname.match(/^\/admin\/category[-_]requests\/([^/]+)\/reject$/);
        if (m && request.method === "POST") {
          const auth = await authorize(request, env, ["ADMIN"]);
          if (auth instanceof Response) return auth;
          const id = m[1].trim();
          const nowIso = (/* @__PURE__ */ new Date()).toISOString();
          const rejected = await env.DB.prepare(
            "UPDATE category_requests SET status='rejected', updated_at=? WHERE id=? AND status IN ('pending','awaiting_review')"
          ).bind(nowIso, id).run();
          if (rejected?.meta?.changes !== 1) {
            return json({ error: "Only pending category requests can be rejected" }, 409);
          }
          return json({
            success: true,
            id,
            action: "reject",
            status: "rejected"
          });
        }
      }
      async function publishProductsSnapshot(env2) {
        const rows = await env2.DB.prepare(`
    SELECT id, name, name_cn, category, sub_category, material, size, finish, code,
           description, description_cn, images, production_sites, status, created_at, updated_at
    FROM products
    WHERE lower(status) = 'published'
    ORDER BY updated_at DESC
  `).all();
        const items = normalizeProductRows(rows?.results ?? []);
        const payload = {
          items,
          meta: {
            count: items.length,
            publishedAt: (/* @__PURE__ */ new Date()).toISOString(),
            version: String(Date.now())
          }
        };
        await env2.SITE_CONFIG_KV.put("published:products", JSON.stringify(payload));
        await env2.SITE_CONFIG_KV.put("published:products:meta", JSON.stringify(payload.meta));
        return payload.meta;
      }
      __name(publishProductsSnapshot, "publishProductsSnapshot");
      __name2(publishProductsSnapshot, "publishProductsSnapshot");
      {
        const matchRemoveImage = pathname.match(/^\/admin\/products\/([^/]+)\/remove-image$/);
        if (matchRemoveImage && request.method === "POST") {
          const auth = await authorize(request, env, ["ADMIN"]);
          if (auth instanceof Response) return auth;
          const productId = matchRemoveImage[1].trim();
          const body = await request.json().catch(() => ({}));
          const key = String(body.key ?? "").trim();
          const url = String(body.url ?? "").trim();
          const autoPublish = body.autoPublish !== false;
          const deleteFromCloud = body.deleteFromCloud === true;
          if (!key && !url) return badRequest("Missing key or url");
          const row = await env.DB.prepare(
            `SELECT images, status FROM products WHERE id = ? LIMIT 1`
          ).bind(productId).first();
          if (!row) return json({ error: "Product not found" }, 404);
          let images = [];
          try {
            const raw = row.images;
            images = Array.isArray(raw) ? raw : JSON.parse(raw || "[]");
            if (!Array.isArray(images)) images = [];
          } catch {
            images = [];
          }
          const nextImages = images.filter((img) => {
            if (!img) return false;
            if (url && img === url) return false;
            if (key && img.includes(key)) return false;
            return true;
          });
          const nowIso = (/* @__PURE__ */ new Date()).toISOString();
          await env.DB.prepare(
            `UPDATE products SET images = ?, updated_at = ? WHERE id = ?`
          ).bind(JSON.stringify(nextImages), nowIso, productId).run();
          if (deleteFromCloud && key) {
            try {
              await env.PRODUCT_IMAGES.delete(key);
            } catch (e) {
              console.warn("[remove-image] cloud delete failed (ignored)", e);
            }
          }
          const status = String(row.status ?? "").toLowerCase();
          let publishedMeta = null;
          if (autoPublish && status === "published") {
            try {
              publishedMeta = await publishProductsSnapshot(env);
            } catch (e) {
              console.warn("[remove-image] auto publish snapshot failed (ignored)", e);
            }
          }
          return json({
            success: true,
            id: productId,
            removed: images.length - nextImages.length,
            images: nextImages,
            autoPublishAttempted: autoPublish && status === "published",
            publishedMeta
          });
        }
      }
      if (pathname === "/admin/accounts" && request.method === "GET") {
        const auth = await authorize(request, env, ["ADMIN"]);
        if (auth instanceof Response) return auth;
        const rows = await env.DB.prepare(
          `SELECT id, username, role, is_active, created_at
           FROM users
           ORDER BY created_at DESC`
        ).all();
        return json({ users: rows.results ?? [] });
      }
      if (pathname === "/admin/accounts" && request.method === "POST") {
        const auth = await authorize(request, env, ["ADMIN"]);
        if (auth instanceof Response) return auth;
        try {
          const body = await request.json();
          if (!body.username || !body.password) return badRequest("Missing fields");
          const passwordError = pzAuthPasswordPolicyError(body.password, body.username);
          if (passwordError) return badRequest(passwordError);
          const role = normalizeRole(body.role ?? "FACTORY");
          if (!["ADMIN","FACTORY"].includes(role)) return badRequest("Invalid role; use organization management for supervisors");
          const dbRole = role === "ADMIN" ? "admin" : "factory";
          const hash2 = await hash(body.password, 10);
          const id = crypto.randomUUID();
          const now = (/* @__PURE__ */ new Date()).toISOString();
          await env.DB.prepare(
            `INSERT INTO users (id, username, password_hash, role, is_active, org_id, created_at)
             VALUES (?, ?, ?, ?, 1, 'org-main', ?)`
          ).bind(id, body.username, hash2, dbRole, now).run();
          return json({ success: true, id });
        } catch (err) {
          console.error("Create user failed", err);
          return json({ error: "User already exists" }, 400);
        }
      }
      {
        const accountResponse = await pzHandleAccountMutation(request, env, { authorize, json, normalizeRole });
        if (accountResponse) return accountResponse;
      }
      if (pathname.startsWith("/admin/accounts/") && pathname.endsWith("/password") && request.method === "POST") {
        const auth = await authorize(request, env, ["ADMIN"]);
        if (auth instanceof Response) return auth;
        const id = pathname.replace("/admin/accounts/", "").replace("/password", "").trim();
        if (!id) return badRequest("Missing user id");
        const body = await request.json();
        const password = typeof body.password === "string" ? body.password : "";
        if (!password) return badRequest("Missing password");
        const target = await env.DB.prepare("SELECT username FROM users WHERE id=? LIMIT 1").bind(id).first();
        if (!target) return json({ error: "Account not found" }, 404);
        const passwordError = pzAuthPasswordPolicyError(password, target.username);
        if (passwordError) return badRequest(passwordError);
        const hash2 = await hash(password, 10);
        await env.DB.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).bind(hash2, id).run();
        return json({ success: true });
      }
      if (pathname === "/admin/inquiries" && request.method === "GET") {
        const auth = await authorize(request, env, ["ADMIN"]);
        if (auth instanceof Response) return auth;
        const rows = await env.DB.prepare(
          `SELECT id, name, email, message, created_at
           FROM inquiries
           ORDER BY created_at DESC
           LIMIT 500`
        ).all();
        return json({ inquiries: rows.results ?? [] });
      }
      return json({ error: "Not found" }, 404);
    } catch (err) {
      if ((request.method === "POST" || request.method === "PUT") && (/^\/(?:admin|factory)\/products$/.test(pathname) || /^\/(?:admin|factory)\/products\/[^/]+$/.test(pathname)) && pzIsSkuConflict(err)) {
        return json({ error: "SKU already exists", code: "SKU_CONFLICT" }, 409);
      }
      console.error("Worker fatal error", err);
      return errorJson("Internal Server Error", 500);
    }
  }
};
// Reusable Worker audit implementation. The complete function is embedded in
// both review Worker bundles because Cloudflare dashboard deploys one pasted file.
// Migration 008 MUST be applied to the correct D1 before deploying that bundle.
// Entries are reserved BEFORE each audited mutation; incomplete entries remain
// visibly "pending" rather than silently claiming successful audit coverage.

function pzAuditCreateFetch(originalFetch, { authorize, json, runtimeExpected }) {
  const maxLimit = 100;
  const productFields = [
    "name", "name_cn", "category", "sub_category", "material", "size", "finish",
    "code", "status", "images", "production_sites", "created_by", "updated_at"
  ];
  const accountFields = ["username", "role", "is_active"];
  const validStatuses = new Set(["pending", "success", "failed"]);

  function classify(path, method) {
    if (path === "/site-config" && method === "PUT")
      return { action: "site_config.save_draft", entity_type: "site_config", entity_id: "site" };
    if (path === "/admin/publish" && method === "POST")
      return { action: "site_config.publish", entity_type: "site_config", entity_id: "site" };
    if (path === "/admin/rollback" && method === "POST")
      return { action: "site_config.rollback", entity_type: "site_config", entity_id: "site" };
    if (path === "/admin/site-config/bootstrap" && method === "POST")
      return { action: "site_config.bootstrap", entity_type: "site_config", entity_id: "site" };
    if (path === "/admin/publish/products" && method === "POST")
      return { action: "product.publish_catalog", entity_type: "catalog", entity_id: "catalog" };
    if (path === "/admin/upload-pdf" && method === "POST")
      return { action: "media.upload_pdf", entity_type: "media", entity_id: "" };
    if (path === "/upload-image" && method === "POST")
      return { action: "media.upload_image", entity_type: "media", entity_id: "" };
    if (path === "/admin/accounts" && method === "POST")
      return { action: "account.create", entity_type: "account", entity_id: "" };
    let m = path.match(/^\/admin\/accounts\/([^/]+)\/password$/);
    if (m && method === "POST")
      return { action: "account.reset_password", entity_type: "account", entity_id: decodeURIComponent(m[1]) };
    m = path.match(/^\/admin\/accounts\/([^/]+)$/);
    if (m && method === "PUT")
      return { action: "account.update", entity_type: "account", entity_id: decodeURIComponent(m[1]) };
    if (m && method === "DELETE")
      return { action: "account.delete", entity_type: "account", entity_id: decodeURIComponent(m[1]) };
    for (const prefix of ["admin", "factory"]) {
      if (path === `/${prefix}/products` && method === "POST")
        return { action: "product.create", entity_type: "product", entity_id: "" };
      m = path.match(new RegExp(`^/${prefix}/products/([^/]+)/submit$`));
      if (m && method === "POST")
        return { action: "product.submit", entity_type: "product", entity_id: decodeURIComponent(m[1]) };
      m = path.match(new RegExp(`^/${prefix}/products/([^/]+)/remove-image$`));
      if (m && method === "POST")
        return { action: "product.remove_image", entity_type: "product", entity_id: decodeURIComponent(m[1]) };
      m = path.match(new RegExp(`^/${prefix}/products/([^/]+)$`));
      if (m && (method === "PUT" || method === "DELETE"))
        return { action: method === "DELETE" ? "product.delete" : "product.update", entity_type: "product", entity_id: decodeURIComponent(m[1]) };
    }
    if (path === "/factory/category-requests" && method === "POST")
      return { action: "category.request_create", entity_type: "category_request", entity_id: "" };
    m = path.match(/^\/admin\/category[-_]requests\/([^/]+)\/(approve|reject)$/);
    if (m && method === "POST")
      return { action: `category.${m[2]}`, entity_type: "category_request", entity_id: decodeURIComponent(m[1]) };
    if (path === "/factory/category-change-requests" && method === "POST")
      return { action: "category.change_request", entity_type: "category_change", entity_id: "" };
    m = path.match(/^\/admin\/category-change-requests\/([^/]+)\/(approve|reject|reconcile)$/);
    if (m && method === "POST")
      return { action: `category_change.${m[2]}`, entity_type: "category_change", entity_id: decodeURIComponent(m[1]) };
    if (path === "/admin/org/departments" && method === "POST")
      return { action: "department.create", entity_type: "department", entity_id: "" };
    if ((path === "/admin/org/accounts" || path === "/supervisor/accounts") && method === "POST")
      return { action: "account.delegated_create", entity_type: "account", entity_id: "" };
    if (path === "/admin/org/assignments" && method === "POST")
      return { action: "account.assign", entity_type: "account", entity_id: "" };
    let orgMatch = path.match(/^\/supervisor\/accounts\/([^/]+)$/);
    if (orgMatch && method === "PATCH")
      return { action: "account.delegated_status", entity_type: "account", entity_id: decodeURIComponent(orgMatch[1]) };
    orgMatch = path.match(/^\/supervisor\/accounts\/([^/]+)\/password$/);
    if (orgMatch && method === "POST")
      return { action: "account.delegated_reset_password", entity_type: "account", entity_id: decodeURIComponent(orgMatch[1]) };
    return null;
  }

  function safeObject(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }
  function stringifySafe(value) {
    const serialized = JSON.stringify(value ?? {});
    // Do not write potentially huge product descriptions or arbitrary request bodies.
    return serialized.length <= 16000 ? serialized : JSON.stringify({ truncated: true });
  }
  function safeSummary(row, fields) {
    if (!row) return null;
    const result = {};
    for (const key of fields) {
      if (row[key] === undefined) continue;
      if (key === "images" || key === "production_sites") {
        try {
          const v = JSON.parse(row[key] || "[]");
          result[key + "_count"] = Array.isArray(v) ? v.length : 0;
        } catch { result[key + "_count"] = 0; }
      } else if (key === "updated_at") {
        result[key] = row[key] ?? null;
      } else {
        result[key] = typeof row[key] === "string" ? row[key].slice(0, 240) : row[key];
      }
    }
    return result;
  }

  function summarizeConfig(raw) {
    const c = safeObject(raw);
    const values = {};
    const paths = [
      "home.hero.title", "home.hero.image", "home.factory.image",
      "home.cta.image", "home.hub_cn.image", "home.hub_kh.image",
      "catalog.url", "about.banner",
      "portfolio.hero_poster", "inquire.hero_poster",
      "manufacturing.hero_machinery", "manufacturing.hero_qc",
      "capabilities.hero_poster", "capacity.map_bg",
      "capacity.card_cn", "capacity.card_kh",
      "menu.feat_collections", "menu.feat_mfg", "menu.feat_capabilities",
      "menu.feat_default"
    ];
    for (const path of paths) {
      const v = path.split(".").reduce((obj, part) => obj?.[part], c);
      if (typeof v === "string") values[path] = v.slice(0, 240);
    }
    const categories = Array.isArray(c.categories) ? c.categories : [];
    values["categories.count"] = categories.length;
    for (const category of categories.slice(0, 100)) {
      const id = String(category?.id || "").replace(/[^a-z0-9_-]/gi, "").slice(0, 60);
      if (!id) continue;
      for (const field of ["title", "title_cn", "title_zh", "image", "hidden"]) {
        const v = category[field];
        if (typeof v === "string" || typeof v === "boolean")
          values["categories." + id + "." + field] =
            typeof v === "string" ? v.slice(0, 240) : v;
      }
      values["categories." + id + ".subCategories_count"] =
        Array.isArray(category.subCategories) ? category.subCategories.length : 0;
    }
    return values;
  }

  async function snapshot(env, entityType, id) {
    if (!env.DB) return null;
    if (entityType === "product" && id) {
      const row = await env.DB.prepare(
        "SELECT name,name_cn,category,sub_category,material,size,finish,code,status,images,production_sites,created_by,updated_at FROM products WHERE id=? LIMIT 1"
      ).bind(id).first();
      return safeSummary(row, productFields);
    }
    if (entityType === "account" && id) {
      const row = await env.DB.prepare(
        "SELECT username,role,is_active FROM users WHERE id=? LIMIT 1"
      ).bind(id).first();
      return safeSummary(row, accountFields);
    }
    if (entityType === "category_request" && id) {
      const row = await env.DB.prepare(
        "SELECT title,title_cn,subtitle,status,image FROM category_requests WHERE id=? LIMIT 1"
      ).bind(id).first();
      return safeSummary(row, ["title", "title_cn", "subtitle", "status", "image"]);
    }
    if (entityType === "category_change" && id) {
      const row = await env.DB.prepare(
        "SELECT category_id,status,created_by FROM category_change_requests WHERE id=? LIMIT 1"
      ).bind(id).first();
      return safeSummary(row, ["category_id", "status", "created_by"]);
    }
    if (entityType === "site_config") {
      if (String(env.PZ_D1_SITE_CONFIG_ENABLED || "").toLowerCase() === "true") {
        const row = await env.DB.prepare(
          "SELECT draft_revision,published_revision,published_version,draft_json,published_json FROM site_config_state WHERE id=1"
        ).first();
        if (!row) return null;
        const draft = JSON.parse(row.draft_json || "{}");
        const published = JSON.parse(row.published_json || "{}");
        return {
          draft_revision: row.draft_revision,
          published_revision: row.published_revision,
          published_version: row.published_version,
          draft_fields: summarizeConfig(draft),
          published_fields: summarizeConfig(published)
        };
      }
      const kv = env.SITE_CONFIG_KV;
      if (!kv) return { store: "kv" };
      const [draftRaw,publishedRaw] = await Promise.all([
        kv.get("draft:site_config"), kv.get("published:site_config")
      ]);
      return { store: "kv", draft_fields: summarizeConfig(JSON.parse(draftRaw || "{}")),
        published_fields: summarizeConfig(JSON.parse(publishedRaw || "{}")) };
    }
    return null;
  }

  function changes(before, after) {
    if (!before || !after) return [];
    const changed = [];
    const walk = (a, b, prefix) => {
      const keys = new Set([...Object.keys(safeObject(a)), ...Object.keys(safeObject(b))]);
      for (const key of keys) {
        const full = prefix ? prefix + "." + key : key;
        if (key === "draft_fields" || key === "published_fields") {
          walk(a?.[key], b?.[key], key === "draft_fields" ? "draft" : "published");
        } else if (JSON.stringify(a?.[key]) !== JSON.stringify(b?.[key])) {
          changed.push(full);
        }
        if (changed.length >= 100) return;
      }
    };
    walk(before,after,"");
    return changed;
  }

  async function readLogs(request, env) {
    const auth = await authorize(request, env, ["ADMIN"]);
    if (auth instanceof Response) return auth;
    if (!env.DB) return json({ error: "Audit D1 unavailable" }, 503);
    const params = new URL(request.url).searchParams;
    const limit = Math.max(1, Math.min(maxLimit, Number.parseInt(params.get("limit") || "30", 10) || 30));
    const page = Math.max(1, Math.min(10000, Number.parseInt(params.get("page") || "1", 10) || 1));
    const where = [];
    const bindings = [];
    for (const [column, param] of [
      ["actor_username", "actor"], ["action", "action"],
      ["entity_type", "type"], ["status", "status"]
    ]) {
      const value = (params.get(param) || "").trim();
      if (!value) continue;
      if (value.length > 120) return json({ error: "Invalid filter length" }, 400);
      if (param === "status" && !validStatuses.has(value))
        return json({ error: "Invalid audit status" }, 400);
      where.push(column + " = ?");
      bindings.push(value);
    }
    for (const [param, comparator] of [["from", ">="], ["to", "<="]]) {
      const value = (params.get(param) || "").trim();
      if (!value) continue;
      if (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)?$/.test(value))
        return json({ error: "Invalid date filter" }, 400);
      where.push("created_at " + comparator + " ?");
      bindings.push(value.length === 10 ? value + (param === "from" ? "T00:00:00.000Z" : "T23:59:59.999Z") : value);
    }
    const whereSql = where.length ? " WHERE " + where.join(" AND ") : "";
    try {
      const totalRow = await env.DB.prepare(
        "SELECT COUNT(*) AS total FROM audit_logs" + whereSql
      ).bind(...bindings).first();
      const rows = await env.DB.prepare(
        "SELECT id,created_at,actor_id,actor_username,actor_role,action,entity_type,entity_id,status,http_status,before_json,after_json,changes_json FROM audit_logs" +
        whereSql + " ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?"
      ).bind(...bindings, limit, (page - 1) * limit).all();
      return json({
        items: (rows.results || []).map(row => ({
          id: row.id, created_at: row.created_at, actor_id: row.actor_id,
          actor_username: row.actor_username, actor_role: row.actor_role,
          action: row.action, entity_type: row.entity_type, entity_id: row.entity_id,
          status: row.status, http_status: row.http_status,
          before: safeObject(JSON.parse(row.before_json || "{}")),
          after: safeObject(JSON.parse(row.after_json || "{}")),
          changed_fields: JSON.parse(row.changes_json || "[]")
        })),
        total: Number(totalRow?.total || 0), page, limit
      });
    } catch (err) {
      console.error("Audit log read failed", err);
      return json({ error: "Audit log storage unavailable" }, 503);
    }
  }

  return async function auditFetch(request, env, ctx) {
    // Preserve each standalone Worker's own environment isolation behavior.
    // In particular Staging-only category routes must keep returning 403 in
    // production mode, before audit authentication is even considered.
    if (runtimeExpected && String(env?.PZ_RUNTIME_ENV || "").toLowerCase() !== runtimeExpected) {
      return originalFetch.call(this, request, env, ctx);
    }
    const path = new URL(request.url).pathname;
    if (path === "/admin/audit-logs") {
      if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
      return readLogs(request, env);
    }
    const event = classify(path, request.method);
    if (!event) return originalFetch.call(this, request, env, ctx);

    const roles = path.startsWith("/admin/") || path === "/site-config"
      ? ["ADMIN"] : path.startsWith("/supervisor/") ? ["SUPERVISOR"] : ["FACTORY", "ADMIN"];
    const auth = await authorize(request, env, roles);
    if (auth instanceof Response) return auth;
    if (!env.DB) return json({ error: "Audit storage unavailable" }, 503);

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    let before = null;
    try {
      before = await snapshot(env, event.entity_type, event.entity_id);
      // Product approval/rejection is a distinct event from ordinary editing.
      if (event.action === "product.update" && path.startsWith("/admin/") &&
          before?.status === "awaiting_review") {
        const body = await request.clone().json().catch(() => ({}));
        if (body?.status === "published") event.action = "product.approve";
        else if (body?.status === "rejected") event.action = "product.reject";
      }
      // Reserve the event before the mutation. A migration/binding failure blocks
      // mutations, rather than permitting unaudited changes.
      await env.DB.prepare(
        "INSERT INTO audit_logs (id,created_at,actor_id,actor_username,actor_role,action,entity_type,entity_id,status,http_status,before_json,after_json,changes_json) " +
        "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)"
      ).bind(id,createdAt,auth.user.id,auth.user.username,auth.user.role,
        event.action,event.entity_type,event.entity_id,"pending",null,
        stringifySafe(before),null,null).run();
    } catch (err) {
      console.error("Audit reservation failed; mutation blocked", err);
      return json({ error: "Audit logging unavailable; no changes applied" }, 503);
    }

    let response;
    try {
      response = await originalFetch.call(this, request, env, ctx);
    } catch (err) {
      console.error("Audited mutation threw", err);
      try {
        await env.DB.prepare(
          "UPDATE audit_logs SET status='failed',http_status=500 WHERE id=? AND status='pending'"
        ).bind(id).run();
      } catch (logError) { console.error("Audit failure finalization failed", logError); }
      throw err;
    }

    // Only post-operation data is captured. No passwords, tokens, customer
    // messages, raw request payloads or customer email addresses are persisted.
    try {
      let body = {};
      if ((response.headers.get("content-type") || "").includes("application/json")) {
        try { body = safeObject(await response.clone().json()); } catch { body = {}; }
      }
      const success = response.ok && body.success !== false && !body.error;
      const entityId = event.entity_id || String(success ? (body.id || body.key || "") : "").slice(0, 200);
      const after = success ? await snapshot(env,event.entity_type,entityId) : null;
      const diff = changes(before, after);
      // When an ID comes back in a create response, the INSERT always stores it.
      await env.DB.prepare(
        "UPDATE audit_logs SET entity_id=?,status=?,http_status=?,after_json=?,changes_json=? WHERE id=? AND status='pending'"
      ).bind(entityId,success?"success":"failed",response.status,
        success?stringifySafe(after):null,JSON.stringify(diff),id).run();
    } catch (err) {
      // An event has already been persisted as pending. Surfacing this state
      // avoids representing an unconfirmed finalization as a successful log.
      console.error("Audit finalization failed; pending event retained", id, err);
      const headers = new Headers(response.headers);
      headers.set("X-PZ-Audit-State", "pending");
      return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
    }
    return response;
  };
}

const pzOrgOriginalFetch = index_default.fetch;
index_default.fetch = pzOrganizationCreateFetch(pzOrgOriginalFetch, { authorize, json, hash, passwordPolicy: pzOrgPasswordPolicy });
const pzAuditOriginalFetch = index_default.fetch;
index_default.fetch = pzAuditCreateFetch(pzAuditOriginalFetch, { authorize, json, runtimeExpected: 'production' });

const pzReviewOriginalFetch = index_default.fetch;
index_default.fetch = pzTwoStageReviewFetch(pzReviewOriginalFetch, {authorize, json});
var pzCorsOriginalFetch = index_default.fetch;
index_default.fetch = async function(request, env, ctx) {
  const response = await pzCorsOriginalFetch.call(this, request, env, ctx);
  const origin = request.headers.get("Origin") || "";
  const headers = new Headers(response.headers);
  if (ALLOWED_ORIGINS.has(origin) || env.PZ_RUNTIME_ENV === "staging" && /^https:\/\/(?:[a-z0-9-]+\.)?pz-website-lw7\.pages\.dev$/i.test(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  } else {
    headers.delete("Access-Control-Allow-Origin");
  }
  const vary = headers.get("Vary") || "";
  if (!vary.split(",").some((v) => v.trim().toLowerCase() === "origin")) {
    headers.set("Vary", vary ? vary + ", Origin" : "Origin");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
};
export {
  index_default as default
};
//# sourceMappingURL=pz-worker-v3.2.1-cors-review.js.map
// Embedded in the standalone Worker bundles used by dashboard deployment.
async function pzHandleAccountMutation(request, env, { authorize, json, normalizeRole }) {
  const match = new URL(request.url).pathname.match(/^\/admin\/accounts\/([^/]+)$/);
  if (!match || !["PUT", "DELETE"].includes(request.method)) return null;
  const auth = await authorize(request, env, ["ADMIN"]);
  if (auth instanceof Response) return auth;
  const id = decodeURIComponent(match[1]);
  const target = await env.DB.prepare("SELECT id,username,role,is_active FROM users WHERE id=? LIMIT 1").bind(id).first();
  if (!target) return json({ error: "账号不存在。" }, 404);

  if (request.method === "DELETE") {
    if (id === auth.user.id) return json({ error: "不能删除当前登录的管理员账号。" }, 409);
    // Discover foreign keys, including CASCADE/SET NULL, before deleting. Also
    // preserve ownership in legacy tables whose creator columns lack a FK.
    // Every reference check is part of the DELETE itself, avoiding a check/delete race.
    const tables = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT GLOB 'sqlite_*' AND name NOT GLOB '_cf_*'").all();
    const quote = value => '"' + String(value).replace(/"/g, '""') + '"';
    const guards = [];
    const bindings = [id];
    for (const { name } of tables.results || []) {
      if (name === "users" || /^(?:sqlite_|_cf_)/i.test(name)) continue;
      let refs;
      try {
        refs = await env.DB.prepare("PRAGMA foreign_key_list(" + quote(name) + ")").all();
      } catch (error) {
        console.error("Account deletion foreign-key inspection failed", {
          table: name, message: String(error?.message || error),
          cause: String(error?.cause?.message || error?.cause || "")
        });
        return json({ error: "暂时无法检查账号关联记录，未执行删除。请联系管理员查看 Worker 日志。" }, 503);
      }
      const columns = new Set((refs.results || [])
        .filter(ref => ref.table === "users" && (!ref.to || ref.to === "id")).map(ref => ref.from));
      if (["products", "category_requests", "category_change_requests"].includes(name)) {
        const info = await env.DB.prepare("PRAGMA table_info(" + quote(name) + ")").all();
        for (const col of info.results || []) {
          if (["created_by", "reviewed_by", "updated_by"].includes(col.name)) columns.add(col.name);
        }
      }
      for (const col of columns) {
        guards.push("NOT EXISTS (SELECT 1 FROM " + quote(name) + " WHERE " + quote(col) + "=?)");
        bindings.push(id);
      }
    }
    const result = await env.DB.prepare(
      "DELETE FROM users WHERE id=? AND (lower(role)<>'admin' OR is_active<>1 OR " +
      "(SELECT COUNT(*) FROM users WHERE lower(role)='admin' AND is_active=1)>1)" +
      (guards.length ? " AND " + guards.join(" AND ") : "")
    ).bind(...bindings).run();
    if (!result.meta?.changes) return json({ error: "该账号关联业务记录或是最后一个有效管理员，不能删除；请使用停用账号。" }, 409);
    return json({ success: true });
  }

  let body;
  try { body = await request.json(); } catch { return json({ error: "请求格式不正确。" }, 400); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "请求格式不正确。" }, 400);
  const sets = [];
  const bindings = [];
  if (Object.prototype.hasOwnProperty.call(body, "username")) {
    if (typeof body.username !== "string" || !body.username.trim() ||
        body.username.trim().length > 80 || /[\s\u0000-\u001f\u007f]/u.test(body.username.trim())) {
      return json({ error: "账号名称须为 1–80 个字符，不能包含空格或控制字符。" }, 400);
    }
    const username = body.username.trim();
    sets.push("username=?");
    bindings.push(username);
    // A conditional UPDATE enforces case-insensitive uniqueness even if the
    // legacy users table only has a case-sensitive unique constraint.
    const duplicate = await env.DB.prepare("SELECT id FROM users WHERE lower(username)=lower(?) AND id<>? LIMIT 1").bind(username, id).first();
    if (duplicate) return json({ error: "账号名称已存在。" }, 409);
  }
  if (Object.prototype.hasOwnProperty.call(body, "is_active")) {
    if (typeof body.is_active !== "boolean") return json({ error: "账号状态格式不正确。" }, 400);
    sets.push("is_active=?"); bindings.push(body.is_active ? 1 : 0);
  }
  if (Object.prototype.hasOwnProperty.call(body, "role")) {
    if (!["ADMIN", "FACTORY"].includes(String(body.role).toUpperCase())) return json({ error: "账号角色不正确。" }, 400);
    sets.push("role=?"); bindings.push(normalizeRole(body.role) === "ADMIN" ? "admin" : "factory");
  }
  if (!sets.length) return json({ error: "没有需要修改的内容。" }, 400);
  const removesAdmin = body.is_active === false || (body.role && normalizeRole(body.role) !== "ADMIN");
  if (removesAdmin && id === auth.user.id) return json({ error: "不能停用或降级当前登录的管理员账号。" }, 409);
  let guard = "";
  if (removesAdmin) guard += " AND (lower(role)<>'admin' OR is_active<>1 OR (SELECT COUNT(*) FROM users WHERE lower(role)='admin' AND is_active=1)>1)";
  if (typeof body.username === "string") {
    guard += " AND NOT EXISTS (SELECT 1 FROM users AS other WHERE lower(other.username)=lower(?) AND other.id<>?)";
  }
  bindings.push(id);
  if (typeof body.username === "string") bindings.push(body.username.trim(), id);
  try {
    const result = await env.DB.prepare("UPDATE users SET " + sets.join(",") + " WHERE id=?" + guard).bind(...bindings).run();
    if (!result.meta?.changes) return json({ error: "账号名称已存在，或该操作会移除最后一个有效管理员。" }, 409);
  } catch (error) {
    if (/UNIQUE constraint/i.test(String(error))) return json({ error: "账号名称已存在。" }, 409);
    throw error;
  }
  return json({ success: true });
}
