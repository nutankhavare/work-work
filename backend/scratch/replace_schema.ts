import fs from "fs";
import path from "path";

function walkDir(dir: string, callback: (filePath: string) => void) {
  fs.readdirSync(dir).forEach((f) => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

function runReplace() {
  const srcDir = path.resolve("src");
  console.log(`Walking directory: ${srcDir}`);
  
  walkDir(srcDir, (filePath) => {
    if (path.extname(filePath) === ".ts") {
      const content = fs.readFileSync(filePath, "utf8");
      if (content.includes("schema1.")) {
        console.log(`Replacing schema1. in: ${filePath}`);
        const updatedContent = content.replace(/schema1\./g, "institute.");
        fs.writeFileSync(filePath, updatedContent, "utf8");
      }
    }
  });
  
  console.log("Schema replacement completed successfully!");
}

runReplace();
