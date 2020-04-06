const { parse, compile, segment, hls } = require('node-webvtt')
const fs = require('fs')
const path = require('path')
const csv = require('csv')

const dicfile = 'dic.csv'
const inputfile = 'input.csv'
const outputfile = 'output.csv'

const inputdir = './input'
const outputdir = './output'

//変換表の配列を格納
let TranslatorData = new Map()
let TranslatorDataOut = new Map()

let PreTranslatorData = []

const csvParser = csv.parse((error, data) => {
    //ループしながら１行ずつ処理
    data.forEach((element, index, array) => {
        TranslatorData.set(element[0],element[1])
    })
    // console.log('文章変換データ')
    // console.log(TranslatorData)
})


const csvParserPreTranslatorData = csv.parse((error, data) => {
    //ループしながら１行ずつ処理
    data.forEach((element, index, array) => {
        PreTranslatorData.push([new RegExp(element[0],'g'),element[1]])
    })
    // console.log('単語データ')
    // console.log(PreTranslatorData)
})

//キャプションデータの抽出
const caption = function (val){
  const v =JSON.parse(val)
  console.log(v.data)
  const webvtt = decodeURI(v.data)
  console.log(webvtt)

  const parsed = parse(webvtt, { meta: true })
  const data = json_text_export(JSON.stringify(parsed))
  const compiled = compile(data)
  const caption = JSON.stringify({data:encodeURI(compiled).replace(/\%0A/g, '%0D%0A')+'%0D%0A'})
  const ret = globalProvideDataGen('caption', caption)
  //console.log(ret)
  return ret
}

//jsのデータを作成
const globalProvideDataGen = function (key, val){
  return `window.globalProvideData('${key}', '${val}');`
}

//翻訳対象の抽出
const json_text_export = function (val){
  return JSON.parse(val, (key, value) => {
    let ret = value
    
    //console.log(key); // 現在のプロパティ名を出力する。最後は ""。
    if(['Text','text','altText','lmstext','description','title'].indexOf(key) >= 0){
      const v = value.trim()
      if(!TranslatorData.has(v)){
        let w = v
        for(let atob in PreTranslatorData){
          w = w.replace(PreTranslatorData[atob][0], PreTranslatorData[atob][1])
          //if(v!=w) console.log('PreTranslatorData:',v,w)
        }
        TranslatorData.set(v,w)
        console.log(key+' add TranslatorData:',v,'=>',w)
      } else {
        ret = TranslatorData.get(v)
        console.log(key+' TranslatorData:',v,'=>',ret)
        TranslatorDataOut.set(v,ret)
      }
    }
    return ret     // 変更されていないプロパティの値を返す。
  })
}

const data = function (key,val){
  const v = JSON.stringify(json_text_export(val)).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  //console.log('Translator_sub:',v)
  const ret = globalProvideDataGen(key, v)
  return ret
}

const paths = function (key,val){
  const u = JSON.parse(val, (key, value) => {
    let ret = value
    if(value.nodeType ){
      if(value.nodeType == 'image' ){
      } else if(value.nodeType == 'filter' ){
      } else if(value.nodeType == 'reComposite' ){
      } else if(value.nodeType == 'reGaussianBlur' ){
      } else if(value.nodeType == 'reFlood' ){
      } else if(value.nodeType == 'defs' ){
      } else if(value.nodeType == 'linearGradient' ){
      } else if(value.nodeType == 'stop' ){
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
            console.log('tspan add TranslatorData:',t)
          } else {
            nt.push(TranslatorData.get(t))
            console.log('tspan TranslatorData:',t,'=>',TranslatorData.get(t))
            TranslatorDataOut.set(t,TranslatorData.get(t))
          }
        }
        ret.children = nt;
        console.log('value.x:'+value.x)
        if(value.x) {value.x = value.x.split(' ',1).join(' ')}//英文前提で文字幅を作ってるので削除する
        console.log('value.x:'+value.x)
      } else{
        console.log('nodeType:',value.nodeType,value)
      }
    }
    return ret;     // 変更されていないプロパティの値を返す。
  })
  const v = JSON.stringify(u).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
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

//ファイル一覧取得
const dirwalk = function(p, fileCallback, errCallback) {

  try {
    const files = fs.readdirSync(p);
    for(let i in files){
      const f = files[i]
        var fp = path.join(p, f) // to full-path
        if(fs.statSync(fp).isDirectory()) {
            dirwalk(fp, fileCallback) // ディレクトリなら再帰
        } else {
            if( /.*\.js$/.test(fp) ) {
              fileCallback(path.relative(inputdir, fp)) // ファイルならコールバックで通知
            }
        }
    }
  } catch (error) {
    errCallback(error)
    return
  }
}

function main () {

  dirwalk(inputdir, function(filepath) {
    console.log(filepath, path.dirname(path.join(inputdir, filepath)) )
    translator(filepath)
  }, function(err) {
    console.log("Receive err:" + err) // エラー受信
  })

  //TranslatorDataの保存
  csv.stringify(Array.from(TranslatorData),(error,output)=>{
      fs.writeFile(outputfile,output,(error)=>{
          console.log('TranslatorDataデータをCSV出力しました。')

          //TranslatorDataの保存
          csv.stringify(Array.from(TranslatorDataOut),(error,output)=>{
              fs.writeFile('TranslatorDataOut.csv',output,(error)=>{
                  console.log('TranslatorDataOutデータをCSV出力しました。')
                  process.exit(0)
              })
          })
      })
  })

}

const translator = function (filepath){
    const window = {}
    let targetfunc = fs.readFileSync(path.join(inputdir, filepath), {encoding: 'utf8'})
    fs.mkdirSync(path.dirname(path.join(outputdir, filepath)), { recursive: true })
    window.globalProvideData =globalProvideData(path.join(outputdir, filepath))
    console.log('------------')
    // jsファイル分実行
    eval(targetfunc)
    console.log('------------')
}



try {
  fs.statSync(dicfile);
  //読み込みと処理を実行
  fs.createReadStream(dicfile).pipe(csvParserPreTranslatorData);
  csvParserPreTranslatorData.on('end', () => {
    console.log('PreTranslatorData loaded')
    try {
      fs.statSync(inputfile);
      //読み込みと処理を実行
      fs.createReadStream(inputfile).pipe(csvParser);
      csvParser.on('end', () => {
        console.log('TranslatorData loaded')
        main()
      })
    } catch (error) {
      if (error.code === 'ENOENT') {
        main()
      }
    }
  })
} catch (error) {
  if (error.code === 'ENOENT') {
  }
}





