import { FaUser } from "react-icons/fa";
import { FaLock } from "react-icons/fa"; 


function Login() {
    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-[360px] md:scale-110 ">
            <form className="flex flex-col justify-center bg-slate-300 rounded-lg border-slate-400 p-6 m-3">
                <h1 className="text-2xl text-center font-bold">Login</h1>

                <div className="border-slate-400 my-4 px-4 py-2 border-2 rounded-lg flex items-center">
                    <input className="w-full bg-slate-300 " type="text" placeholder="Username"></input>
                    <FaUser className="mx-2"  />
                </div>

                <div className="border-slate-400 border-2 px-4 py-2 rounded-lg flex items-center">
                    <input className="w-full bg-slate-300 " type="password" placeholder="Password"></input>
                    <FaLock className="mx-2" />
                </div>

                <div className="flex justify-between my-2">
                    <div className="">
                        <input id="rememberMe" type="checkbox"></input>
                        <label className="ml-2" htmlFor="rememberMe">Remember me</label>
                    </div>

                    <a href="#">Forgot Password?</a>
                </div>

                <button className="bg-cyan-100 rounded-lg my-2 w-4/5 p-1 self-center cursor-pointer" >Login</button>

                <p className="text-center">Don't have an account? <a href="#" className="font-bold">Register</a></p>
            </form>
        </div>
    )
}

export default Login