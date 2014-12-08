//angular.module('qarin')
//    .factory('socketBuilder', function (socketFactory, env) {

//        var builder = function (namespace) {
//            var myIoSocket = io.connect(env.apiRoot + namespace);

//            mySocket = socketFactory({
//                ioSocket: myIoSocket
//            });

//            return mySocket;
//        }

//        return builder;

//    })
//    .factory('chatSocket', function (socketBuilder) {
//        //return socketBuilder('/chat');
//        return null;
//    })
//.factory('notificationSocket', function (socketBuilder) {
//    //return socketBuilder('/notifications');
//    return null;
//});