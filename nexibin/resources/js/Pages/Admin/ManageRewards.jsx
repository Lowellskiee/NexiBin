import { Head, router, usePage, useForm } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { useState } from "react";

export default function ManageRewards(){

const { rewards } = usePage().props;

const [showForm,setShowForm] = useState(false);
const [editing,setEditing] = useState(null);

const { data,setData,post,put,reset } = useForm({
name:"",
description:"",
points_required:"",
stock:"",
is_active:true
});

const submit = (e)=>{
e.preventDefault();

if(editing){
put(route("admin.rewards.update",editing.id),{
onSuccess:()=>{
reset();
setShowForm(false);
setEditing(null);
}
});
}else{
post(route("admin.rewards.store"),{
onSuccess:()=>{
reset();
setShowForm(false);
}
});
}
};

const deleteReward=(id)=>{
if(confirm("Delete reward?")){
router.delete(route("admin.rewards.delete",id));
}
};

return(

<AdminLayout>

<Head title="Manage Rewards"/>

<div className="p-4 md:p-6 max-w-6xl mx-auto">

{/* Header */}
<div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3">
<h1 className="text-2xl font-bold">Manage Rewards</h1>

<button
onClick={()=>{setShowForm(!showForm); setEditing(null);}}
className="bg-yellow-400 hover:bg-yellow-500 px-4 py-2 rounded-lg text-sm font-semibold shadow"
>
+ New Reward
</button>
</div>

{/* Form */}
{showForm && (

<div className="bg-white shadow-md rounded-lg p-4 md:p-6 mb-6">

<h2 className="font-semibold mb-4 text-lg">
{editing ? "Edit Reward" : "Create Reward"}
</h2>

<form onSubmit={submit} className="grid gap-4 md:grid-cols-2">

<input
type="text"
placeholder="Reward name"
value={data.name}
onChange={(e)=>setData("name",e.target.value)}
className="border rounded-lg p-2 w-full"
/>

<textarea
placeholder="Description"
value={data.description}
onChange={(e)=>setData("description",e.target.value)}
className="border rounded-lg p-2 w-full md:col-span-2"
/>

<input
type="number"
placeholder="Points Required"
value={data.points_required}
onChange={(e)=>setData("points_required",e.target.value)}
className="border rounded-lg p-2 w-full"
/>

<input
type="number"
placeholder="Stock"
value={data.stock}
onChange={(e)=>setData("stock",e.target.value)}
className="border rounded-lg p-2 w-full"
/>

<div className="md:col-span-2 flex gap-3">

<button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
Save Reward
</button>

<button
type="button"
onClick={()=>{setShowForm(false); setEditing(null);}}
className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg"
>
Cancel
</button>

</div>

</form>

</div>

)}

{/* MOBILE VIEW (CARDS) */}
<div className="md:hidden space-y-4">

{rewards.map(r => (
<div key={r.id} className="bg-white shadow rounded-lg p-4">

<h2 className="font-semibold text-lg">{r.name}</h2>

<p className="text-sm text-gray-600 mt-1">
Points: <span className="font-medium">{r.points_required}</span>
</p>

<p className="text-sm text-gray-600">
Stock: <span className="font-medium">{r.stock}</span>
</p>

<div className="flex gap-4 mt-4">

<button
onClick={()=>{setEditing(r);setShowForm(true);}}
className="text-yellow-600 font-medium"
>
Edit
</button>

<button
onClick={()=>deleteReward(r.id)}
className="text-red-600 font-medium"
>
Delete
</button>

</div>

</div>
))}

</div>

{/* DESKTOP VIEW (TABLE) */}
<div className="hidden md:block bg-white shadow rounded-lg overflow-hidden">

<table className="w-full text-sm">

<thead className="bg-gray-100">
<tr className="text-left">
<th className="p-3">Name</th>
<th className="p-3">Points</th>
<th className="p-3">Stock</th>
<th className="p-3">Action</th>
</tr>
</thead>

<tbody>

{rewards.length === 0 && (
<tr>
<td colSpan="4" className="text-center p-4 text-gray-500">
No rewards found
</td>
</tr>
)}

{rewards.map(r=>(
<tr key={r.id} className="border-t">

<td className="p-3 font-medium">{r.name}</td>
<td className="p-3">{r.points_required}</td>
<td className="p-3">{r.stock}</td>

<td className="p-3 flex gap-3">

<button
onClick={()=>{setEditing(r);setShowForm(true);}}
className="text-yellow-600 hover:underline"
>
Edit
</button>

<button
onClick={()=>deleteReward(r.id)}
className="text-red-600 hover:underline"
>
Delete
</button>

</td>

</tr>
))}

</tbody>

</table>

</div>

</div>

</AdminLayout>

);

}