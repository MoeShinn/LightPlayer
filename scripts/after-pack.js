// Nhung icon + thong tin vao LightPlayer.exe sau khi dong goi.
// Dung rcedit truc tiep (co san file chay trong package) thay vi signAndEditExecutable,
// de khong phai tai winCodeSign (hay loi symlink khi khong co quyen admin / Developer Mode).
const path = require('path');
const rcedit = require('rcedit');

exports.default = async function afterPack(ctx) {
  if (ctx.electronPlatformName !== 'win32') return;
  const exe = path.join(ctx.appOutDir, ctx.packager.appInfo.productFilename + '.exe');
  await rcedit(exe, {
    icon: path.join(ctx.packager.projectDir, 'assets', 'icon.ico'),
    'version-string': {
      ProductName: 'LightPlayer',
      FileDescription: 'LightPlayer',
      OriginalFilename: 'LightPlayer.exe'
    }
  });
  console.log('  • da nhung icon vao ' + path.basename(exe));
};
