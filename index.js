const { parse, compile, segment, hls } = require('node-webvtt');
const fs = require('fs');
const csv = require('csv');


//変換表の配列を格納
let TranslatorData = new Map();

const csvParser = csv.parse((error, data) => {
    //ループしながら１行ずつ処理
    data.forEach((element, index, array) => {
        TranslatorData.set(element[0],element[1]);
    })
    console.log('処理データ');
    console.log(TranslatorData);
})

//読み込みと処理を実行
fs.createReadStream('input.csv').pipe(csvParser);

//キャプションデータの抽出
function caption (val){
  const v =JSON.parse(val)
  console.log(v.data)
  const webvtt = decodeURI(v.data)
  console.log(webvtt)

  const parsed = parse(webvtt, { meta: true })
  const data = json_text_export(JSON.stringify(parsed))
  const compiled = compile(data);
  const caption = JSON.stringify({data:encodeURI(compiled).replace(/\%0A/g, '%0D%0A')+'%0D%0A'})
  const ret = globalProvideDataGen('caption', caption)
  //console.log(ret)
  return ret
}

//jsのデータを作成
function globalProvideDataGen(key, val){
  return `window.globalProvideData('${key}', '${val}');`
}

//翻訳対象の抽出
function json_text_export(val){
  return JSON.parse(val, (key, value) => {
    let ret = value
    
    //console.log(key); // 現在のプロパティ名を出力する。最後は ""。
    if(['Text','text','altText','lmstext','description','title'].indexOf(key) >= 0){
      const v = value.trim()
      if(!TranslatorData.has(v)){
        TranslatorData.set(v,v)
        console.log('add TranslatorData:',v)
      } else {
        ret = TranslatorData.get(v)
        console.log('TranslatorData:',v,'=>',ret)
      }
    }
    return ret;     // 変更されていないプロパティの値を返す。
  })
}


function data (key,val){
  const v = JSON.stringify(json_text_export(val)).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
//.replace(/\\\\/g, '\\\\\\\\').replace(/\\"/g, '\\\\"').replace(/\\n/g, '\\\\n')
  //console.log('Translator_sub:',v)
  const ret = globalProvideDataGen(key, v)
  return ret
}

function paths (key,val){
  const u = JSON.parse(val, (key, value) => {
    let ret = value
    if(value.nodeType ){
      if(value.nodeType == 'image' ){
      } else if(value.nodeType == 'path' ){
      } else if(value.nodeType == 'use' ){
      } else if(value.nodeType == 'text' ){
      } else if(value.nodeType == 'g' ){
      } else if(value.nodeType == 'tspan' ){
        //console.log(value.children,value.x)
        const nt = []
        for(let i in value.children) {
          const t = value.children[i].trim()
          if(!TranslatorData.has(t)){
            TranslatorData.set(t,t)
            console.log('add TranslatorData:',t)
          } else {
            nt.push(TranslatorData.get(t))
            console.log('TranslatorData:',t,'=>',TranslatorData.get(t))
          }
        }
        ret.children = nt;
        console.log('value.x:'+value.x)
        if(value.x) {value.x = value.x.split(' ',1).join(' ')}
        console.log('value.x:'+value.x)
      } else{
        console.log('nodeType:',value.nodeType,value)
      }
    }
    return ret;     // 変更されていないプロパティの値を返す。
  })
  const v = JSON.stringify(u).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
//.replace(/\\\\/g, '\\\\\\\\').replace(/\\"/g, '\\\\"').replace(/\\n/g, '\\\\n')
  //console.log('Translator_sub:',v)
  const ret = globalProvideDataGen(key, v)
  return ret
}

// currying
const globalProvideData = function (path) {
  return function (key,val){
    let output = ''
    if(key == 'caption') output = caption(val)
    if(key == 'data') output = data('data',val)
    if(key == 'slide') output = data('slide',val)
    if(key == 'paths') output = paths('paths',val)
    if(key == 'frame') output = data('frame',val)
    fs.writeFile(path,output,(error)=>{
      console.log(`save ${path}`)
      return output
    })
  }
}

csvParser.on('end', () => {
  console.log('TranslatorData loaded')

  // ./input配下を読み込み
  const allDirents = fs.readdirSync('./input', { withFileTypes: true })
  const fileNames = allDirents.filter(dirent => dirent.isFile() && /.*\.js$/.test(dirent.name)).map(({ name }) => name);
  console.log(fileNames);

  // jsファイル分実行
  for(let i in fileNames) {
    console.log(fileNames[i]);
    const window = {}
    let targetfunc = fs.readFileSync('./input/'+fileNames[i], {encoding: 'utf8'})
    window.globalProvideData =globalProvideData('./output/'+fileNames[i])
    console.log('------------')
    eval(targetfunc)
    console.log('------------')
  }

  //TranslatorDataの保存
  csv.stringify(Array.from(TranslatorData),(error,output)=>{
      fs.writeFile('out.csv',output,(error)=>{
          console.log('TranslatorDataデータをCSV出力しました。');
      })
  })
});
