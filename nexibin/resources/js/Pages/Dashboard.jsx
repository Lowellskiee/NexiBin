import { useState, useEffect } from "react";
import { usePage, Link, Head, router } from "@inertiajs/react";
import { Html5Qrcode } from "html5-qrcode";

export default function Dashboard() {

const { auth, rewards, flash } = usePage().props;
const user = auth.user;

useEffect(() => {

if (flash && flash.success) {
alert(flash.success);
}

}, [flash]);

const [showMenu,setShowMenu] = useState(false);
const [showScanner,setShowScanner] = useState(false);
const [qrInstance,setQrInstance] = useState(null);

const openScanner = async ()=>{

setShowScanner(true);

const qr = new Html5Qrcode("reader");
setQrInstance(qr);

const devices = await Html5Qrcode.getCameras();

if(devices.length){

qr.start(
devices[0].id,
{fps:10, qrbox:200},
(decodedText)=>{
alert("Scanned: "+decodedText);
}
);

}

};

const closeScanner = async ()=>{

setShowScanner(false);

if(qrInstance){
await qrInstance.stop().catch(err=>console.log(err));
}

};

return(

<>

<Head title="Dashboard"/>

<div className="min-h-screen flex items-center justify-center bg-gray-200 py-10">

<div className="w-full max-w-[700px] bg-white rounded-[45px] shadow-[0_30px_80px_rgba(0,0,0,0.25)] overflow-hidden">

<div className="px-10 py-14 max-h-[85vh] overflow-y-auto">

{/* Header */}

<div className="flex justify-between items-center">

<div>

<h1 className="text-sm text-gray-500">
Welcome back,
</h1>

<h2 className="font-bold text-xl text-[#1B1F5E]">
{user.name}!
</h2>

</div>

<div className="flex items-center gap-3">

<button
onClick={openScanner}
className="w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shadow hover:scale-105 transition"
>
📷
</button>

<div className="relative">

<button
onClick={()=>setShowMenu(!showMenu)}
className="w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center font-bold text-[#1B1F5E]"
>
{user.name.substring(0,2).toUpperCase()}
</button>

{showMenu &&(

<div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border text-sm z-50">

<Link
href={route("profile.edit")}
className="block px-4 py-2 hover:bg-gray-100"
>
Profile
</Link>

<Link
href={route("logout")}
method="post"
as="button"
className="w-full text-left px-4 py-2 hover:bg-gray-100"
>
Logout
</Link>

</div>

)}

</div>

</div>

</div>

{/* Points Card */}

<div className="bg-[#1B1F5E] text-white rounded-2xl mt-6 p-5 shadow-md">

<h3 className="text-sm opacity-80">
Total Points
</h3>

<p className="text-3xl font-bold mt-1">
{Number(user.points).toLocaleString()}
<span className="text-lg font-medium"> pts</span>
</p>

</div>

{/* Rewards */}

<div className="mt-8 space-y-4">

<div className="flex justify-between text-sm">

<span className="font-semibold">
Rewards
</span>

<span className="text-gray-500">
Details
</span>

</div>

{rewards.length === 0 ? (

<p className="text-xs text-gray-500">
No rewards available.
</p>

) : (

rewards.map((reward)=>(

<div
key={reward.id}
className="bg-gray-50 rounded-xl p-4 shadow-sm flex justify-between items-center"
>

<div>

<h4 className="font-semibold text-sm">
{reward.name}
</h4>

<p className="text-xs text-gray-500 mt-1">
{reward.description}
</p>

</div>

<div className="text-right">

<p className="font-bold text-[#1B1F5E]">
{reward.points_required} pts
</p>

<button
onClick={() =>
router.post(route("rewards.redeem", reward.id), {}, {
preserveScroll: true
})
}
className="mt-2 text-xs bg-[#1B1F5E] text-white px-3 py-1 rounded-full hover:opacity-90"
>
Redeem
</button>

</div>

</div>

))

)}

</div>

</div>

</div>

</div>

{/* Scanner */}

{showScanner &&(

<div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">

<div className="bg-white w-[90%] max-w-sm rounded-2xl p-5 text-center">

<h2 className="font-bold text-lg text-[#1B1F5E] mb-4">
Scan QR Code
</h2>

<div id="reader" className="w-full mb-4"></div>

<button
onClick={closeScanner}
className="px-6 py-2 bg-[#1B1F5E] text-white rounded-full text-sm"
>
Close
</button>

</div>

</div>

)}

</>

);

}