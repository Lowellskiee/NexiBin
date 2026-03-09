import { Head, usePage } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Bar } from "react-chartjs-2";

import {
Chart as ChartJS,
CategoryScale,
LinearScale,
BarElement,
Title,
Tooltip,
Legend
} from "chart.js";

ChartJS.register(
CategoryScale,
LinearScale,
BarElement,
Title,
Tooltip,
Legend
);

export default function AdminDashboard(){

const {
totalUsers,
totalStaff,
totalAdmins,
totalRedemptions,
topUser,
redemptions = [],
topRewards = []
} = usePage().props;

/* -----------------------------
   CHART DATA
----------------------------- */

const chartData = {
labels: topRewards.map(r => r.reward?.name || "Unknown"),
datasets: [
{
label: "Redemptions",
data: topRewards.map(r => r.total),
backgroundColor: "#1B1F5E",
borderRadius: 6
}
]
};

const chartOptions = {
responsive: true,
maintainAspectRatio: false,
plugins:{
legend:{display:false},
title:{
display:true,
text:"Most Redeemed Rewards"
}
}
};

return(
<>
<Head title="Admin Dashboard"/>

<AdminLayout>

<div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">

{/* -----------------------------
   ANALYTICS CARDS
----------------------------- */}

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

<Card title="Total Users" value={totalUsers}/>

<Card title="Total Staff" value={totalStaff}/>

<Card title="Total Admins" value={totalAdmins}/>

<Card
title="Rewards Redeemed"
value={totalRedemptions}
color="text-green-600"
/>

<Card
title="Top Redeemer"
value={topUser?.user?.name || "No data"}
sub={topUser?.total + " redemptions"}
/>

</div>


{/* -----------------------------
   CHART SECTION
----------------------------- */}

<div className="bg-white rounded-2xl shadow p-4 md:p-5">

<h2 className="text-lg font-semibold mb-4">
Reward Analytics
</h2>

{topRewards.length === 0 ?(

<p className="text-gray-500 text-sm">
No analytics data yet.
</p>

):(

<div className="h-[220px] md:h-[320px]">
<Bar data={chartData} options={chartOptions}/>
</div>

)}

</div>


{/* -----------------------------
   REDEMPTION ACTIVITY
----------------------------- */}

<div className="bg-white rounded-2xl shadow p-4 md:p-5">

<h2 className="text-lg font-semibold mb-4">
Recent Reward Redemptions
</h2>

{redemptions.length === 0 ?(

<p className="text-gray-500 text-sm">
No redemption activity yet.
</p>

):(

<>

{/* -----------------------------
   MOBILE VIEW (CARDS)
----------------------------- */}

<div className="md:hidden space-y-4">

{redemptions.map(r =>(

<div
key={r.id}
className="border rounded-xl p-4 shadow-sm"
>

<p className="text-xs text-gray-400">
Transaction
</p>

<p className="font-semibold text-blue-600">
{r.transaction_id}
</p>

<div className="mt-2">

<p className="text-xs text-gray-400">
User
</p>

<p className="font-medium">
{r.user?.name}
</p>

</div>

<div className="mt-2">

<p className="text-xs text-gray-400">
Reward
</p>

<p>
{r.reward?.name}
</p>

</div>

<div className="flex justify-between mt-3 text-sm">

<div>
<p className="text-xs text-gray-400">Points</p>
<p>{r.points_used}</p>
</div>

<div>
<p className="text-xs text-gray-400">Date</p>
<p>{new Date(r.created_at).toLocaleDateString()}</p>
</div>

</div>

</div>

))}

</div>


{/* -----------------------------
   DESKTOP VIEW (TABLE)
----------------------------- */}

<div className="hidden md:block">

<table className="w-full text-sm">

<thead className="bg-gray-100">

<tr>

<th className="p-3 text-left">
Transaction
</th>

<th className="p-3 text-left">
User
</th>

<th className="p-3 text-left">
Reward
</th>

<th className="p-3 text-left">
Points
</th>

<th className="p-3 text-left">
Date
</th>

</tr>

</thead>

<tbody>

{redemptions.map(r =>(

<tr
key={r.id}
className="border-t hover:bg-gray-50"
>

<td className="p-3 font-semibold text-blue-600">
{r.transaction_id}
</td>

<td className="p-3">
{r.user?.name}
</td>

<td className="p-3">
{r.reward?.name}
</td>

<td className="p-3">
{r.points_used}
</td>

<td className="p-3">
{new Date(r.created_at).toLocaleString()}
</td>

</tr>

))}

</tbody>

</table>

</div>

</>

)}

</div>

</div>

</AdminLayout>

</>
);
}


/* -----------------------------
   CARD COMPONENT
----------------------------- */

function Card({title,value,sub,color="text-[#1B1F5E]"}){
return(

<div className="bg-white rounded-2xl shadow p-4 md:p-5">

<h3 className="text-sm text-gray-500">
{title}
</h3>

<p className={`text-2xl font-bold mt-1 ${color}`}>
{value}
</p>

{sub &&(

<p className="text-xs text-gray-500 mt-1">
{sub}
</p>

)}

</div>

);
}