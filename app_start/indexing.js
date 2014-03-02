

     var fs = require('fs')
       , Stream = require('stream').Readable
       , tokenizr = require('../lib/tokenStream')
       , id3 = require('../lib/AudioInfo/asfParser')
       , AudioInfo = require('../lib/AudioInfo/audioInfo')
       , file =  "C:\\Users\\Jason\\Music\\Snow Patrol\\A Hundred Million Suns\\01 Snow Patrol- A Hundred Million Suns -  If There's A Rocket Tie Me To It.mp3"
       , stream   = fs.createReadStream(file)
       ;

    var tagsPassed = false
      //, info = new InfoStream()
      , tags = new AudioInfo(stream) //require('../lib/AudioInfo/id3v1Parser')() //new AudioInfo(file)
      //, size = fs.statSync(file).size
      ;

    //file = 'C:\\Users\\Jason\\Music\\Bastille - Bad Blood (The Extended Cut) 2013 Alternative 320kbps CBR MP3 [VX]\\1\\03 Bastille - Bad Blood.mp3'
    //stream   = fs.createReadStream(file)


    tags.on('info', function(data){
        var f = data    

        fs.writeFile(__dirname + "/cover.jpg", data.picture.data)
    })

    //stream.pipe(tags)

   // var rs =  new Stream()
   //   , str = [':-)sk','ip con','tent']
   //   , off = 0;


   // rs._read = function () {
   //     setTimeout(function () {
   //         rs.push(str[off]);
   //         off++
   //     }, 100);
   // };

   ////var toknzr = 


   // tokenizr(rs)
   //     .readBuffer(3, function(b){
   //         this.header = b.toString('utf8')
   //     })
   //     .loop(function(end){
   //         this.readBuffer(2, function(b){
   //             this.header = b.toString('utf8')
   //         })
   //         .tap(function(){
   //             this.header === 'ip' && end()
   //         })   
   //     })
   //     .readBuffer(1, function(b){
   //         this.header = b.toString('utf8')
   //     })
        

    //tags.on('done', function(d){
    //    s = this.size || this.bytesRead;
    //    stream.pipe(info)
    //})

    //tags.on('header', function(d){
    //    s = this.size || this.bytesRead;
    //    stream.pipe(info)
    //})

    //info.once('frame', function(frame){
    //    s += this.bytesRead;

    //    var duration = Math.floor((size - s) / ( frame.bitRate / 8));

    //    console.log(frame)
    //})


