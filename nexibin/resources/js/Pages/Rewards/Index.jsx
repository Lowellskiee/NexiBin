import { Head, usePage, Link, router } from "@inertiajs/react";
import { useState } from "react";

export default function Index(){

const { rewards = [], auth } = usePage().props;
const user = auth.user;

const [confirmReward,setConfirmReward] = useState(null);


/* -----------------------------
REDEEM REWARD
----------------------------- */

const redeemReward = (reward)=>{

router.post(
route("rewards.redeem",reward.id),
{},
{ preserveScroll:true }
);

setConfirmReward(null);

};


/* -----------------------------
UI
----------------------------- */

return(

<>

<Head title="Rewards"/>

<div className="min-h-screen bg-gray-100 flex justify-center p-3">

<div className="w-full max-w-xl">


{/* HEADER */}

<div className="flex justify-between items-center mb-4">

<h1 className="text-xl font-bold text-[#1B1F5E]">
Rewards
</h1>

<Link
href={route("dashboard")}
className="text-blue-600 text-xs font-semibold"
>
← Dashboard
</Link>

</div>



{/* USER POINTS CARD */}

<div className="bg-[#1B1F5E] text-white p-4 rounded-2xl mb-4 shadow">

<p className="text-xs opacity-80">
Your Points
</p>

<p className="text-3xl font-bold mt-1">
{Number(user.points).toLocaleString()}
<span className="text-sm"> pts</span>
</p>

</div>



{/* REWARDS LIST */}

<div className="space-y-3">

{rewards.length === 0 && (

<p className="text-gray-500 text-xs">
No rewards available.
</p>

)}


{rewards.map((reward)=>{

const canRedeem = user.points >= reward.points_required;

const progress = Math.min(
(user.points / reward.points_required) * 100,
100
);

return(

<div
key={reward.id}
className={`bg-white rounded-xl shadow p-3 ${
canRedeem ? "border border-green-500" : ""
}`}
>


{/* IMAGE */}

<img
src={reward.image ? `/storage/${reward.image}` : "https://via.placeholder.com/300"}
className="w-full h-24 object-cover rounded-lg mb-2"
/>


{/* TITLE */}

<h2 className="text-sm font-semibold text-[#1B1F5E]">
{reward.name}
</h2>

<p className="text-xs text-gray-500 mb-2">
{reward.description}
</p>



{/* PROGRESS BAR */}

<div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">

<div
className="bg-green-500 h-1.5 rounded-full"
style={{ width:`${progress}%` }}
></div>

</div>

<p className="text-[10px] text-gray-500 mb-2">
{Math.floor(progress)}% toward reward
</p>



{/* FOOTER */}

<div className="flex justify-between items-center">

<div>

<p className="font-bold text-xs text-[#1B1F5E]">
{reward.points_required} pts
</p>

<p className="text-[10px] text-gray-400">
Stock: {reward.stock}
</p>

</div>

<button
disabled={!canRedeem}
onClick={()=>setConfirmReward(reward)}
className={`px-3 py-1 rounded-full text-white text-xs ${
canRedeem
? "bg-[#1B1F5E]"
: "bg-gray-400 cursor-not-allowed"
}`}
>
{canRedeem ? "Redeem" : "Not Enough Points"}
</button>

</div>

</div>

);

})}

</div>

</div>

</div>



{/* CONFIRM REDEEM MODAL */}

{confirmReward && (

<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

<div className="bg-white p-5 rounded-xl w-[90%] max-w-xs text-center">

<h2 className="font-bold text-sm mb-2">
Confirm Redemption
</h2>

<p className="text-xs mb-4">

Redeem <strong>{confirmReward.name}</strong> for

<strong> {confirmReward.points_required} points</strong>?

</p>

<div className="flex justify-center gap-2">

<button
onClick={()=>setConfirmReward(null)}
className="px-3 py-1 bg-gray-300 rounded text-xs"
>
Cancel
</button>

<button
onClick={()=>redeemReward(confirmReward)}
className="px-3 py-1 bg-[#1B1F5E] text-white rounded text-xs"
>
Confirm
</button>

</div>

</div>

</div>

)}

</>

);

}