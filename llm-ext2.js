(function(ext) {
    // Define variables
    var apiBaseUrl = 'https://port9593.octopus-tech.com';
    var token = null;
    var currentChain = {};  // Stores conversation chain, e.g., { 'default': [{role, content}, ...] }
    var sseBuffer = '';  // Stores the SSE buffer for incremental streams
    var lastStreamText = '';  // Stores the last stream text
    var streamInProgress = false;  // Flag to check if a stream is in progress

    // _shutdown function when the extension is unloaded
    ext._shutdown = function() {};

    // _getStatus function to report the status of the extension
    ext._getStatus = function() {
        return { status: 2, msg: 'Ready' };
    };

    // Login function (Scratch block: "登入 用戶名 [USERNAME] 密碼 [PASSWORD]")
    ext.login = function(username, password, callback) {
        fetch(`${apiBaseUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })
        .then(response => response.json())
        .then(data => {
            token = data.token;
            callback();
        })
        .catch(err => {
            console.error(err);
            callback();
        });
    };

    // Function to handle streaming of messages (Scratch block: "串流訊息 [TEXT]")
    ext.streamMessage = function(text, callback) {
        if (streamInProgress) {
            callback('Stream is already in progress');
            return;
        }

        streamInProgress = true;
        lastStreamText = text;
        
        fetch(`${apiBaseUrl}/stream`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: text })
        })
        .then(response => response.text())
        .then(data => {
            sseBuffer += data;
            callback(sseBuffer);
            streamInProgress = false;
        })
        .catch(err => {
            console.error(err);
            streamInProgress = false;
            callback('Error in streaming');
        });
    };

    // Function to retrieve the conversation (Scratch block: "獲取對話")
    ext.getConversation = function(callback) {
        callback(currentChain);
    };

    // Function to save a message to the conversation chain (Scratch block: "保存訊息 [ROLE] [CONTENT]")
    ext.saveMessage = function(role, content, callback) {
        if (!currentChain['default']) {
            currentChain['default'] = [];
        }

        currentChain['default'].push({ role: role, content: content });
        callback();
    };

    // Define the blocks and their parameters
    var descriptor = {
        blocks: [
            ['w', '登入 用戶名 %s 密碼 %s', 'login', 'test_user', '123456'],
            ['w', '串流訊息 %s', 'streamMessage', 'Hello, how are you?'],
            ['h', '獲取對話', 'getConversation'],
            ['w', '保存訊息 %s %s', 'saveMessage', 'user', 'Hello!']
        ]
    };

    // Register the extension
    ScratchExtensions.register('Chat Extension', descriptor, ext);
})({});
