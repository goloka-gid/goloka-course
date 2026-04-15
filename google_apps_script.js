function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var email = data.email || 'Неизвестный';
    var day = data.day || 'Неизвестный день';
    var text = data.text || '';
    var date = new Date();
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Homeworks");
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Homeworks");
      sheet.appendRow(["Дата", "Email / Пользователь", "День", "Текст задания"]);
    }
    
    sheet.appendRow([date, email, day, text]);
    
    return ContentService.createTextOutput(JSON.stringify({"success": true}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({"success": false, "error": error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Скрипт для приема домашних заданий работает.");
}