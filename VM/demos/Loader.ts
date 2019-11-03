namespace Loader
{
    requirejs.config({
        baseUrl: "../js/demos/demos/",
        paths: {
            "react" : "../../../react/react.development",
            "react-dom" : "../../../react/react-dom.development",
            "react-codemirror" : "../../../node_modules/react-codemirror/dist/react-codemirror",
            "codemirror" : "../../../node_modules/codemirror"
        }    
    });

    function DisplayLoadingError(err : any) : void{
        $(".loader").hide();
        $("#loadErrorContainer").show();
        $("#errorType").text(err.requireType);
        
        let modules = "";

        err.requireModules.map( (module : any) => 
        {
            modules += module + "<br/>";
        });

        $("#errorModules").html(modules);
    }

    let start = new Date();
    let loadCount = 0;
    requirejs.onResourceLoad = (contect, map, depArray) => 
    {
        let duration = new Date().getTime() - start.getTime();
        loadCount++;

        $("#module").text(name);
        $("#url").text(map.url ? " at " + map.url : "");
        $("#elapsedTime").text(duration + "ms");
        $("#moduleCount").text(loadCount);
    };

    export function LoadApp(container:string, appName:string, props:any):void{
        require(["react", "react-dom", appName], (React : any, ReactDOM: any, App: any) => {
            ReactDOM.render(
                React.createElement(App.default, props),
                document.getElementById(container)
            );
        }, DisplayLoadingError);
    }
}