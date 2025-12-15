import { FaUser } from "react-icons/fa";
import { FaLock } from "react-icons/fa"; 


function Login() {
    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] md:scale-110 ">
            <form className="flex flex-col justify-center bg-slate-100 rounded-md border-slate-400 shadow-lg p-6 m-3">
                <h1 className="text-2xl text-center font-bold">Login</h1>

                <div className="flex flex-wrap items-center">
                    <input className="w-full h-8 bg-slate-100 outline-none pl-3 pr-10 pb-4 pt-4 border-slate-300 my-5 border-2 rounded-sm" type="text" placeholder="Username"></input>
                    <FaUser className="absolute right-14"  />
                </div>

                <div className="flex flex-wrap items-center">
                    <input className="w-full h-8 bg-slate-100 outline-none pl-3 pr-10 pb-4 pt-4 border-slate-300 border-2 rounded-sm" type="password" placeholder="Password"></input>
                    <FaLock className="absolute right-14" />
                </div>

                <div className="flex justify-between items-center my-3">
                    <div className="flex items-center">
                        <input id="rememberMe" type="checkbox"></input>
                        <label className="ml-2 text-sm" htmlFor="rememberMe">Remember me</label>
                    </div>

                    <a href="#" className="ml-2 text-sm">Forgot Password?</a>
                </div>

                <button className="bg-cyan-200 rounded-sm my-2 w-4/5 p-1 self-center cursor-pointer" >Login</button>

                <p className="text-center text-sm">Don't have an account? <a href="#" className="font-bold">Register</a></p>
            </form>
        </div>
    )
}

export default Login