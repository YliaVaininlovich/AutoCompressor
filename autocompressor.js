const fs = require('fs');
const zlib = require('zlib');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);


async function compressFile(filePath) {
  
    //архивы пропускаем
    if (filePath.endsWith('.gz')) {
        return;
    }
    
    const compressedFilePath = filePath + '.gz';
 
    const [fileStats, compressedFileStats] = await Promise.all([
      stat(filePath),
      stat(compressedFilePath).catch(() => null)
    ]);
  
    if (compressedFileStats && compressedFileStats.mtime >= fileStats.mtime ) {
      console.log(`${compressedFilePath} - архив актуален`);
      return;
    }
    else {
        console.log(`${compressedFilePath} - архив пересоздается`);
    }
  
    console.log(`${filePath} - идет сжатие файла`);
  
    const input = fs.createReadStream(filePath);
    const output = fs.createWriteStream(compressedFilePath);
  
    const gzipStream = zlib.createGzip();
    input.pipe(gzipStream).pipe(output);
  
    await new Promise((resolve, reject) => {
      output.on('finish', resolve);
      output.on('error', reject);
    });
  
        console.log(`${filePath} - сжатие завершено`); 
}

async function processDirectory(directoryPath) {
  
    console.log(`${directoryPath} - сканирование директории`);

  const files = await readdir(directoryPath);

  await Promise.all(files.map(async (file) => {
    const filePath = path.join(directoryPath, file);

    const fileStats = await stat(filePath);
    if (fileStats.isDirectory()) {
      await processDirectory(filePath);
    } else {
      await compressFile(filePath);
    }
  }));
}

async function main() {
  const directoryPath = process.argv[2];
  if (!directoryPath) {
    console.log('Введите путь к папке');
    return;
  }

  try {
    await processDirectory(directoryPath);
    console.log('Все файлы успешно сжаты');
  } catch (error) {
    console.error('Произошла ошибка при сжатии файлов:', error);
  }
}

main();