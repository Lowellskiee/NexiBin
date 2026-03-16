import { Head, usePage, router } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Bar, Line } from "react-chartjs-2";
import { useState, useEffect } from "react";

import {
Chart as ChartJS,
CategoryScale,
LinearScale,
BarElement,
LineElement,
PointElement,
Title,
Tooltip,
Legend
} from "chart.js";

ChartJS.register(
CategoryScale,
LinearScale,
BarElement,
LineElement,
PointElement,
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
topRewards = [],
topUsers = [],
activity = [],
redemptions = { data: [] },
logs = []
} = usePage().props;


/* STATE */

const [activeChart,setActiveChart] = useState("rewards");
const [wasteView,setWasteView] = useState("weekly");

const [weeklyData,setWeeklyData] = useState([]);
const [monthlyData,setMonthlyData] = useState([]);
const [yearlyData,setYearlyData] = useState([]);


/* REWARD CHART DATA */

const rewardsChart = {
labels: topRewards.map(r => r.reward?.name || "Unknown"),
datasets:[
{
label:"Redemptions",
data: topRewards.map(r => r.total),
backgroundColor:"#1B1F5E",
borderRadius:8
}
]
};

const activityChart = {
labels: activity.map(a => a.date),
datasets:[
{
label:"Redemptions",
data: activity.map(a => a.total),
borderColor:"#2563EB",
backgroundColor:"rgba(37,99,235,0.1)",
tension:0.4
}
]
};


/* GENERATE WASTE ANALYTICS */

useEffect(()=>{

if(!logs || logs.length === 0){

setWeeklyData([]);
setMonthlyData([]);
setYearlyData([]);
return;

}

/* WEEKLY */

const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const weeklyCounts = {};

logs.forEach(log => {

if(!log.collected_at) return;

const date = new Date(log.collected_at);
const day = days[date.getDay()];

weeklyCounts[day] = (weeklyCounts[day] || 0) + 1;

});

const weekly = days.map(day => ({
day,
total: weeklyCounts[day] || 0
}));

setWeeklyData(weekly);


/* MONTHLY */

const months = [
"Jan","Feb","Mar","Apr","May","Jun",
"Jul","Aug","Sep","Oct","Nov","Dec"
];

const monthlyCounts = {};

months.forEach(month=>{
monthlyCounts[month] = 0;
});

logs.forEach(log => {

if(!log.collected_at) return;

const date = new Date(log.collected_at);
const month = months[date.getMonth()];

monthlyCounts[month]++;

});

const monthly = months.map(month => ({
month,
total: monthlyCounts[month]
}));

setMonthlyData(monthly);


/* YEARLY */

const yearlyCounts = {};

logs.forEach(log => {

if(!log.collected_at) return;

const year = new Date(log.collected_at).getFullYear();

yearlyCounts[year] = (yearlyCounts[year] || 0) + 1;

});

const yearly = Object.keys(yearlyCounts)
.map(Number)
.sort((a,b)=>a-b)
.map(year=>({
year,
total: yearlyCounts[year]
}));

setYearlyData(yearly);

},[logs]);


/* CHART OPTIONS */

const chartOptions = {
responsive:true,
maintainAspectRatio:false,
scales:{
y:{
beginAtZero:true,
ticks:{
stepSize:1,
precision:0
}
}
}
};


/* UI */

return(
<>

<Head title="Admin Dashboard"/>

<AdminLayout>

<div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-8 space-y-10">

{/* ANALYTICS CARDS */}

<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6">

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
value={topUser?.user?.name || "No Data"}
sub={`${topUser?.total || 0} redemptions`}
icon="🏆"
/>

</div>



{/* REWARD ANALYTICS */}

<div className="bg-white rounded-2xl shadow p-6">

<div className="flex md:hidden mb-6 gap-3">

<button
onClick={()=>setActiveChart("rewards")}
className={`px-4 py-2 rounded-lg text-sm font-medium ${
activeChart==="rewards"
?"bg-[#1B1F5E] text-white"
:"bg-gray-200"
}`}
>
Rewards
</button>

<button
onClick={()=>setActiveChart("activity")}
className={`px-4 py-2 rounded-lg text-sm font-medium ${
activeChart==="activity"
?"bg-[#1B1F5E] text-white"
:"bg-gray-200"
}`}
>
Activity
</button>

</div>


<div className="md:hidden h-[320px]">

{activeChart==="rewards"
?<Bar data={rewardsChart}/>
:<Line data={activityChart}/>
}

</div>


<div className="hidden md:grid md:grid-cols-2 gap-8">

<div className="h-[350px]">

<h2 className="text-lg font-semibold mb-4">
Most Redeemed Rewards
</h2>

<Bar data={rewardsChart}/>

</div>

<div className="h-[350px]">

<h2 className="text-lg font-semibold mb-4">
Redemption Activity
</h2>

<Line data={activityChart}/>

</div>

</div>

</div>



{/* LEADERBOARD + RECENT REDEMPTIONS */}

<div className="grid md:grid-cols-2 gap-8">

{/* LEADERBOARD */}

<div className="bg-white rounded-2xl shadow p-6">

<h2 className="text-xl font-semibold mb-5">
Top Users Leaderboard
</h2>

<div className="space-y-4">

{topUsers.map((u,index)=>{

const medal =
index===0?"🥇":
index===1?"🥈":
index===2?"🥉":"#"+(index+1);

return(

<div
key={u.id}
className="flex justify-between items-center border-b pb-3"
>

<span className="text-lg font-medium">
{medal} {u.user?.name}
</span>

<span className="text-gray-600">
{u.total} redemptions
</span>

</div>

)

})}

</div>

</div>



{/* RECENT REDEMPTIONS */}

<div className="bg-white rounded-2xl shadow p-6">

<h2 className="text-xl font-semibold mb-5">
Recent Reward Redemptions
</h2>

<div className="space-y-3 max-h-80 overflow-y-auto">

{(redemptions?.data || []).map(r=>(

<div
key={r.id}
className="flex justify-between items-center border-b pb-2"
>

<span className="text-blue-600 font-semibold text-sm">
{r.transaction_id}
</span>

<span className="text-sm">
{r.user?.name}
</span>

<span className="text-sm">
{r.reward?.name}
</span>

<span className="text-sm font-medium">
{r.points_used} pts
</span>

</div>

))}

</div>


<div className="flex justify-center items-center gap-4 mt-6">

<button
disabled={!redemptions?.prev_page_url}
onClick={()=>router.get(redemptions.prev_page_url)}
className="px-4 py-2 rounded bg-gray-200 disabled:opacity-40"
>
Previous
</button>

<span className="text-sm text-gray-600">
Page {redemptions?.current_page} of {redemptions?.last_page}
</span>

<button
disabled={!redemptions?.next_page_url}
onClick={()=>router.get(redemptions.next_page_url)}
className="px-4 py-2 rounded bg-gray-200 disabled:opacity-40"
>
Next
</button>

</div>

</div>

</div>



{/* WASTE ANALYTICS */}

<div className="bg-white rounded-2xl shadow p-6">

<h2 className="text-xl font-semibold mb-6">
Waste Collection Analytics
</h2>

<div className="flex gap-3 mb-6">

<button
onClick={()=>setWasteView("weekly")}
className={`px-4 py-2 rounded-lg ${
wasteView==="weekly"
?"bg-[#1B1F5E] text-white"
:"bg-gray-200"
}`}
>
Weekly
</button>

<button
onClick={()=>setWasteView("monthly")}
className={`px-4 py-2 rounded-lg ${
wasteView==="monthly"
?"bg-[#1B1F5E] text-white"
:"bg-gray-200"
}`}
>
Monthly
</button>

<button
onClick={()=>setWasteView("yearly")}
className={`px-4 py-2 rounded-lg ${
wasteView==="yearly"
?"bg-[#1B1F5E] text-white"
:"bg-gray-200"
}`}
>
Yearly
</button>

</div>


<div className="h-[400px]">

{wasteView==="weekly" && (

<Line
data={{
labels: weeklyData.map(d=>d.day),
datasets:[
{
label:"Bins Collected",
data: weeklyData.map(d=>d.total),
borderColor:"#1B1F5E",
backgroundColor:"rgba(27,31,94,0.1)",
tension:0.4
}
]
}}
options={chartOptions}
/>

)}

{wasteView==="monthly" && (

<Bar
data={{
labels: monthlyData.map(d=>d.month),
datasets:[
{
label:"Bins Collected",
data: monthlyData.map(d=>d.total),
backgroundColor:"#3b82f6"
}
]
}}
options={chartOptions}
/>

)}

{wasteView==="yearly" && (

<Bar
data={{
labels: yearlyData.map(d=>d.year),
datasets:[
{
label:"Bins Collected",
data: yearlyData.map(d=>d.total),
backgroundColor:"#22c55e"
}
]
}}
options={chartOptions}
/>

)}

</div>

</div>

</div>

</AdminLayout>

</>

);

}


/* CARD COMPONENT */

function Card({title,value,icon,sub,color="text-[#1B1F5E]"}){

return(

<div className="bg-white rounded-2xl shadow hover:shadow-lg transition p-6 flex justify-between items-center">

<div>

<p className="text-sm text-gray-500">
{title}
</p>

<p className={`text-3xl font-bold mt-2 ${color}`}>
{value ?? 0}
</p>

{sub &&(
<p className="text-sm text-gray-500 mt-1">
{sub}
</p>
)}

</div>

{icon && (
<div className="text-4xl opacity-70">
{icon}
</div>
)}

</div>

);

}