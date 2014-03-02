module.exports = {
	httpMethod: {
		GET	  : "GET",
		POST  : "POST",
		PUT	  : "PUT",
		DELETE: "DELETE"

	},
    mediaTypes: {
        DIR: "DIR",
        IMAGE: "IMAGE",
        AUDIO: "AUDIO",
        VIDEO: "VIDEO",
        PODCAST: "PODCAST"    
    },
    userRoles: {
        ADMIN: 0,
        DOWNLOAD: 1,
        STREAM:  2,
        PODCAST: 3    
    },
    extensions: {
          AUDIO: [ "mp3", "ogg", "wma", "m4a", "wav", "flac"]
        , VIDEO: [ "avi", "wma", "mpeg", "mp4", "mov"]
		, IMAGE: [ "jpg", "jpeg", "png", "bmp", "gif"]   
    }
}