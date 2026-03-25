/**
 * Google Apps Script (GAS) for Design Check RAG
 * 
 * 1. Google Drive上の「プロンプト.txt」と「詳細図AI解析_RAG最適化ファイル_rev1.xlsx」を取得します。
 * 2. Excelファイルは一時的にGoogleスプレッドシートに変換して内容を読み取ります。
 * 3. 取得した内容をJSON形式で返却します。
 * 
 * 【設定方法】
 * 1. Google Apps Script エディタを開く
 * 2. このコードを貼り付ける
 * 3. 「サービス」から「Drive API」を追加する
 * 4. 「デプロイ」 > 「新しいデプロイ」 > 「ウェブアプリ」として公開
 * 5. アクセスできるユーザーを「全員」にする
 * 6. 発行されたURLを .env の VITE_GAS_URL に設定する
 */

function doGet(e) {
  const promptFileName = "プロンプト.txt";
  const ragFileName = "詳細図AI解析_RAG最適化ファイル_rev1.xlsx";
  
  let promptContent = "";
  let ragContent = "";
  
  try {
    // 1. プロンプトファイルの取得
    const promptFiles = DriveApp.getFilesByName(promptFileName);
    if (promptFiles.hasNext()) {
      promptContent = promptFiles.next().getBlob().getDataAsString();
    } else {
      promptContent = "Error: プロンプト.txt が見つかりません。";
    }
    
    // 2. RAG Excelファイルの取得と変換
    const ragFiles = DriveApp.getFilesByName(ragFileName);
    if (ragFiles.hasNext()) {
      const excelFile = ragFiles.next();
      
      // ExcelをGoogleスプレッドシートに変換して読み取る
      // ※Drive API (v2 or v3) が必要です
      const resource = {
        title: "temp_rag_sheet_" + new Date().getTime(),
        mimeType: MimeType.GOOGLE_SHEETS
      };
      
      // Drive APIを使用して変換
      const tempSheetFile = Drive.Files.insert(resource, excelFile.getBlob());
      const tempSheetId = tempSheetFile.id;
      
      try {
        const ss = SpreadsheetApp.openById(tempSheetId);
        const sheets = ss.getSheets();
        const allData = {};
        
        sheets.forEach(sheet => {
          const name = sheet.getName();
          const values = sheet.getDataRange().getValues();
          allData[name] = values;
        });
        
        ragContent = JSON.stringify(allData);
      } finally {
        // 一時ファイルを削除
        Drive.Files.remove(tempSheetId);
      }
    } else {
      ragContent = "Error: 詳細図AI解析_RAG最適化ファイル_rev1.xlsx が見つかりません。";
    }
  } catch (err) {
    console.error(err);
    return ContentService.createTextOutput(JSON.stringify({
      error: err.toString(),
      prompt: promptContent || "Error during execution",
      ragData: ragContent || "Error during execution"
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const result = {
    prompt: promptContent,
    ragData: ragContent
  };
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
