use std::fs;
use std::env;
extern crate staticfile;
extern crate mount;
use std::path::Path;
extern crate params;
use params::{Params, Value};

extern crate iron;
extern crate time;

use iron::prelude::*;
use iron::{BeforeMiddleware, AfterMiddleware, typemap};
use time::precise_time_ns;

// use iron::Iron;
use staticfile::Static;
use mount::Mount;
// fn prueba(ab :u8) {}


struct ResponseTime;

impl typemap::Key for ResponseTime { type Value = u64; }

impl BeforeMiddleware for ResponseTime {
    fn before(&self, req: &mut Request) -> IronResult<()> {
        req.extensions.insert::<ResponseTime>(precise_time_ns());
        Ok(())
    }
}

impl AfterMiddleware for ResponseTime {
    fn after(&self, req: &mut Request, res: Response) -> IronResult<Response> {
        let delta = precise_time_ns() - *req.extensions.get::<ResponseTime>().unwrap();
        println!("Request took: {} ms", (delta as f64) / 1000000.0);
        Ok(res)
    }
}

fn hello_world(req: &mut Request) -> IronResult<Response> {
    //let a = req.params.query.a ;
    let map = req.get_ref::<Params>().unwrap();

    
    match map.find(&["path"]) {
        Some(&Value::String(ref path)) => {
    
            match fs::read_dir(path) {
                Ok(paths) => {
                    let mut file_list: Vec<String> = Vec::new();
                    for path in paths {
                        //println!("Name: {}", path.unwrap().path().display());
                        let path:String = format!("{}",path.unwrap().path().display());
                        file_list.push(format!("\"{}\"",path.replace("\\","/")))
                    }
                    let joined = file_list.join(",");
                    let ax = format!("{}{}{}","{\"file_list\":[",joined,"]}");

                    return Ok(Response::with((iron::status::Ok, ax)))

                
                },
                _ => {
                    return Ok(Response::with((iron::status::Ok, "{\"file_list\":[],\"error\":\"no such file or directory\"}")))                
                }
            
            }

        },
        _ => {
            return Ok(Response::with((iron::status::Ok,"{\"file_list\":[]}")))
        }
    }
    //Ok(Response::with((iron::status::Ok, ax)))
}


fn move_file(req: &mut Request) -> IronResult<Response> {
    //let a = req.params.query.a ;
    let map = req.get_ref::<Params>().unwrap();
    
    match map.find(&["path"]) {
        Some(&Value::String(ref path)) => {

            match map.find(&["destination"]) {
                Some(&Value::String(ref destination)) => {
                    println!("COPY {} -> {}", path, destination);
                    match fs::rename(path, destination) {
                        Ok(_) => {
                            println!("COPY:{}", path);
                            return Ok(Response::with((iron::status::Ok, "OK")));                
                        
                        }
                        Err(x) => {
                            println!("ERROR:{}", x);
                            return Ok(Response::with((iron::status::Ok,"ERROR_FILE_CANNOT_BE_MOVED")));
                        
                        }
                    }
                }
                _ => {
                    return Ok(Response::with((iron::status::Ok,"ERROR")))
                }
                
            }
        }
        _ => {
            return Ok(Response::with((iron::status::Ok,"ERROR2")))
        }
    }
    //Ok(Response::with((iron::status::Ok, ax)))
}


fn main() {
    //let mut chain = Chain::new(hello_world);
    //chain.link_before(ResponseTime);
    //chain.link_after(ResponseTime);

    let mut mount = Mount::new();
    mount.mount("/", Static::new(Path::new("/")));
    mount.mount("/file_list/",hello_world);
    mount.mount("/move_file/",move_file);
    //mount.mount("/test/",|_: &mut Request| {
    //    Ok(Response::with((status::Ok, "Hello World! //////")))
    //});
    let p = env::current_dir().unwrap();
    println!("The current directory is {}", p.display());
    Iron::new(mount).http("localhost:3000").unwrap();


}
