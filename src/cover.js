// Doc anh bia nhung san trong file (chi doc dung doan can thiet, khong nap ca file).
// MP4/M4A/MOV: atom covr | MKV/WebM: attachment anh | MP3: ID3v2 APIC
const fs = require('fs');
const path = require('path');

const MAX_COVER = 8 * 1024 * 1024;
const MAX_META = 32 * 1024 * 1024;

function readAt(fd, pos, len) {
  const b = Buffer.allocUnsafe(len);
  const n = fs.readSync(fd, b, 0, len, pos);
  return n === len ? b : b.subarray(0, n);
}

/* ---------------- MP4 ---------------- */
function* boxes(buf, s, e) {
  while (s + 8 <= e) {
    let len = buf.readUInt32BE(s), hdr = 8;
    const type = buf.toString('latin1', s + 4, s + 8);
    if (len === 1) { if (s + 16 > e) return; len = Number(buf.readBigUInt64BE(s + 8)); hdr = 16; }
    else if (len === 0) len = e - s;
    if (len < hdr || s + len > e) return;
    yield { type, start: s + hdr, end: s + len };
    s += len;
  }
}
function findBox(buf, s, e, chain) {
  for (const b of boxes(buf, s, e)) {
    if (b.type !== chain[0]) continue;
    if (chain.length === 1) return b;
    const r = findBox(buf, b.start + (b.type === 'meta' ? 4 : 0), b.end, chain.slice(1));
    if (r) return r;
  }
  return null;
}
function mp4Cover(fd, size) {
  let pos = 0;
  while (pos + 8 <= size) {
    const h = readAt(fd, pos, 16);
    if (h.length < 8) break;
    let len = h.readUInt32BE(0), hdr = 8;
    const type = h.toString('latin1', 4, 8);
    if (len === 1) { if (h.length < 16) break; len = Number(h.readBigUInt64BE(8)); hdr = 16; }
    else if (len === 0) len = size - pos;
    if (len < hdr) break;
    if (type === 'moov') {
      if (len - hdr > MAX_META) return null;
      const body = readAt(fd, pos + hdr, len - hdr);
      const covr = findBox(body, 0, body.length, ['udta', 'meta', 'ilst', 'covr']) || findBox(body, 0, body.length, ['meta', 'ilst', 'covr']);
      if (!covr) return null;
      for (const d of boxes(body, covr.start, covr.end)) {
        if (d.type === 'data' && d.end - d.start > 8) return body.subarray(d.start + 8, d.end);
      }
      return null;
    }
    pos += len;
  }
  return null;
}

/* ---------------- MKV / WebM ---------------- */
function readElem(fd, pos, size) {
  if (pos >= size) return null;
  const b = readAt(fd, pos, 16);
  if (b.length < 2) return null;
  let l = 1, m = 0x80;
  while (l <= 4 && !(b[0] & m)) { l++; m >>= 1; }
  if (l > 4) return null;
  let id = 0;
  for (let i = 0; i < l; i++) id = id * 256 + b[i];
  const sb = b[l];
  if (sb === undefined) return null;
  let sl = 1; m = 0x80;
  while (sl <= 8 && !(sb & m)) { sl++; m >>= 1; }
  if (sl > 8 || l + sl > b.length) return null;
  let sz = sb & (m - 1), allOnes = (sb & (m - 1)) === m - 1;
  for (let i = 1; i < sl; i++) { sz = sz * 256 + b[l + i]; if (b[l + i] !== 0xff) allOnes = false; }
  return { id, size: allOnes ? -1 : sz, dataStart: pos + l + sl };
}
function seekFindAttachments(body, segStart) {
  // SeekHead: nhieu Seek(0x4DBB) { SeekID(0x53AB), SeekPosition(0x53AC) }
  let p = 0;
  const num = (s, e) => { let v = 0; for (let i = s; i < e; i++) v = v * 256 + body[i]; return v; };
  const el = (q) => {
    let l = 1, m = 0x80;
    while (l <= 4 && !(body[q] & m)) { l++; m >>= 1; }
    const id = num(q, q + l);
    let sl = 1; m = 0x80;
    while (sl <= 8 && !(body[q + l] & m)) { sl++; m >>= 1; }
    let sz = body[q + l] & (m - 1);
    for (let i = 1; i < sl; i++) sz = sz * 256 + body[q + l + i];
    const s = q + l + sl;
    return { id, s, e: s + sz };
  };
  while (p < body.length - 2) {
    const e = el(p); if (e.e > body.length || e.e <= p) break;
    if (e.id === 0x4DBB) {
      let q = e.s, sid = null, spos = null;
      while (q < e.e - 2) {
        const c = el(q); if (c.e > e.e || c.e <= q) break;
        if (c.id === 0x53AB) sid = num(c.s, c.e);
        else if (c.id === 0x53AC) spos = num(c.s, c.e);
        q = c.e;
      }
      if (sid === 0x1941A469 && spos != null) return segStart + spos;
    }
    p = e.e;
  }
  return null;
}
function parseAttachments(fd, att, size) {
  let best = null;
  const end = att.size < 0 ? size : att.dataStart + att.size;
  let p = att.dataStart;
  while (p < end) {
    const f = readElem(fd, p, size);
    if (!f || f.size < 0) break;
    if (f.id === 0x61A7) {
      let name = '', mime = '', data = null;
      let q = f.dataStart; const fe = f.dataStart + f.size;
      while (q < fe) {
        const c = readElem(fd, q, size);
        if (!c || c.size < 0) break;
        if (c.id === 0x466E && c.size < 1024) name = readAt(fd, c.dataStart, c.size).toString('utf8');
        else if (c.id === 0x4660 && c.size < 128) mime = readAt(fd, c.dataStart, c.size).toString('latin1');
        else if (c.id === 0x465C) data = { pos: c.dataStart, len: c.size };
        q = c.dataStart + c.size;
      }
      if (data && data.len > 0 && data.len <= MAX_COVER && /^image\/(jpeg|png|webp)/i.test(mime)) {
        const isCover = /^(small_)?(cover|poster|thumb|folder)/i.test(name.replace(/\.[^.]+$/, ''));
        if (isCover && (!best || !best.isCover)) best = { ...data, isCover };
        else if (!best) best = { ...data, isCover: false };
      }
    }
    p = f.dataStart + f.size;
  }
  return best ? readAt(fd, best.pos, best.len) : null;
}
function mkvCover(fd, size) {
  const eh = readElem(fd, 0, size);
  if (!eh || eh.id !== 0x1A45DFA3 || eh.size < 0) return null;
  const seg = readElem(fd, eh.dataStart + eh.size, size);
  if (!seg || seg.id !== 0x18538067) return null;
  const segStart = seg.dataStart;
  let p = segStart, attPos = null;
  while (p < size) {
    const e = readElem(fd, p, size);
    if (!e) break;
    if (e.id === 0x1941A469) return parseAttachments(fd, e, size);
    if (e.id === 0x114D9B74 && e.size > 0 && e.size < 65536) {
      const found = seekFindAttachments(readAt(fd, e.dataStart, e.size), segStart);
      if (found != null) attPos = found;
    }
    if (e.id === 0x1F43B675 || e.size < 0) break; // toi Cluster thi dung quet tuan tu
    p = e.dataStart + e.size;
  }
  if (attPos != null) {
    const e = readElem(fd, attPos, size);
    if (e && e.id === 0x1941A469) return parseAttachments(fd, e, size);
  }
  return null;
}

/* ---------------- MP3 (ID3v2.3/2.4) ---------------- */
const synch = (b, o) => ((b[o] & 127) << 21) | ((b[o + 1] & 127) << 14) | ((b[o + 2] & 127) << 7) | (b[o + 3] & 127);
function id3Cover(fd, size) {
  const h = readAt(fd, 0, 10);
  if (h.length < 10 || h.toString('latin1', 0, 3) !== 'ID3' || h[3] < 3) return null;
  const ver = h[3], tagSize = synch(h, 6);
  if (tagSize <= 0 || tagSize > MAX_META || tagSize + 10 > size) return null;
  const buf = readAt(fd, 10, tagSize);
  let p = 0;
  if (h[5] & 0x40) p += ver === 4 ? synch(buf, 0) : buf.readUInt32BE(0) + 4;
  while (p + 10 <= buf.length) {
    const id = buf.toString('latin1', p, p + 4);
    if (!/^[A-Z0-9]{4}$/.test(id)) break;
    const fl = ver === 4 ? synch(buf, p + 4) : buf.readUInt32BE(p + 4);
    const body = p + 10, end = body + fl;
    if (end > buf.length) break;
    if (id === 'APIC') {
      const enc = buf[body];
      let q = buf.indexOf(0, body + 1); if (q < 0 || q >= end) return null;
      q += 2; // het mime + 1 byte picture type
      if (enc === 1 || enc === 2) { while (q + 1 < end && !(buf[q] === 0 && buf[q + 1] === 0)) q += 2; q += 2; }
      else { while (q < end && buf[q] !== 0) q++; q += 1; }
      return q < end ? buf.subarray(q, end) : null;
    }
    p = end;
  }
  return null;
}

/* ---------------- API ---------------- */
function getCover(file) {
  const ext = path.extname(file).toLowerCase();
  const fn = ['.mp4', '.m4v', '.mov', '.m4a'].includes(ext) ? mp4Cover
    : ['.mkv', '.webm'].includes(ext) ? mkvCover
    : ext === '.mp3' ? id3Cover : null;
  if (!fn) return null;
  let fd;
  try {
    fd = fs.openSync(file, 'r');
    const buf = fn(fd, fs.fstatSync(fd).size);
    return buf && buf.length > 64 && buf.length <= MAX_COVER ? Buffer.from(buf) : null;
  } catch { return null; }
  finally { if (fd !== undefined) try { fs.closeSync(fd); } catch {} }
}

module.exports = { getCover };
