import { Head, router, usePage, useForm } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { useState } from "react";

export default function ManageRewards(){

const { rewards = [] } = usePage().props;

const [search,setSearch] = useState("");
const [editing,setEditing] = useState(null);
const [showForm,setShowForm] = useState(false);

const { data,setData,post,put,reset,processing } = useForm({
name:"",
description:"",
points_required:"",
stock:"",
image:""
});


/* ================= FILTER ================= */

const filteredRewards = rewards.filter(r =>
r.name.toLowerCase().includes(search.toLowerCase())
);


/* ================= GROUP ================= */

const inStock = filteredRewards.filter(r => r.stock > 0);
const outStock = filteredRewards.filter(r => r.stock <= 0);


/* ================= FORM ================= */

const openCreate = () => {

reset();
setEditing(null);
setShowForm(true);

};

const openEdit = (reward)=>{

setEditing(reward);

setData({
name:reward.name,
description:reward.description,
points_required:reward.points_required,
stock:reward.stock,
image:reward.image
});

setShowForm(true);

};

const submit = (e)=>{

e.preventDefault();

if(editing){

put(route("admin.rewards.update",editing.id),{

onSuccess:()=>{
setShowForm(false);
reset();
}

});

}else{

post(route("admin.rewards.store"),{

onSuccess:()=>{
setShowForm(false);
reset();
}

});

}

};

const deleteReward=(id)=>{

if(confirm("Delete reward?")){

router.delete(route("admin.rewards.delete",id));

}

};


/* ================= RENDER DESKTOP TABLE ================= */

const renderDesktopRows=(groupTitle,groupRewards)=>{

if(groupRewards.length===0) return null;

return(

<>

<tr className="bg-gray-100">

<td colSpan="5" className="px-6 py-3 text-center font-bold underline">
{groupTitle}
</td>

</tr>

{groupRewards.map(r=>(

<tr key={r.id} className="border-b hover:bg-gray-50">

<td className="px-6 py-4">

<img
src={r.image || "https://via.placeholder.com/50"}
className="w-12 h-12 rounded-lg object-cover"
/>

</td>

<td className="font-medium">
{r.name}

<p className="text-xs text-gray-500">
{r.description}
</p>

</td>

<td className="text-center">
{r.points_required}
</td>

<td className="text-center font-bold">
{r.stock}
</td>

<td className="text-center space-x-3">

<button
onClick={()=>openEdit(r)}
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

</>

);

};


/* ================= RENDER MOBILE CARDS ================= */

const renderMobileCards=(groupTitle,groupRewards)=>{

if(groupRewards.length===0) return null;

return(

<div className="space-y-4">

<h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">
{groupTitle}
</h3>

{groupRewards.map(r=>(

<div key={r.id} className="bg-white p-4 rounded-xl shadow">

<div className="flex items-center gap-4">

<img
src={r.image || "https://via.placeholder.com/50"}
className="w-14 h-14 rounded-lg object-cover"
/>

<div>

<h3 className="font-semibold">
{r.name}
</h3>

<p className="text-xs text-gray-500">
{r.description}
</p>

</div>

</div>

<div className="flex justify-between mt-4 text-sm">

<span>
Points: <strong>{r.points_required}</strong>
</span>

<span>
Stock: <strong>{r.stock}</strong>
</span>

</div>

<div className="flex gap-4 mt-4 text-sm">

<button
onClick={()=>openEdit(r)}
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

);

};



return(

<>

<Head title="Manage Rewards"/>

<AdminLayout>


{/* ================= HEADER ================= */}

<div className="mb-6">

<div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">

<h2 className="text-xl font-semibold">
Manage Rewards
</h2>

<button
onClick={openCreate}
className="bg-yellow-400 hover:bg-yellow-500 px-4 py-2 rounded-lg font-semibold text-sm"
>
+ New Reward
</button>

</div>

<input
type="text"
placeholder="Search rewards..."
value={search}
onChange={(e)=>setSearch(e.target.value)}
className="border px-4 py-2 rounded-lg w-full md:w-1/3 mt-4"
/>

</div>


{/* ================= FORM ================= */}

{showForm && (

<div className="bg-white p-6 rounded-2xl shadow mb-6">

<h3 className="font-semibold mb-4">
{editing ? "Edit Reward" : "Create Reward"}
</h3>

<form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

<input
placeholder="Reward Name"
value={data.name}
onChange={(e)=>setData("name",e.target.value)}
className="border p-2 rounded"
required
/>

<input
type="number"
placeholder="Points Required"
value={data.points_required}
onChange={(e)=>setData("points_required",e.target.value)}
className="border p-2 rounded"
required
/>

<input
type="number"
placeholder="Stock"
value={data.stock}
onChange={(e)=>setData("stock",e.target.value)}
className="border p-2 rounded"
/>

<input
placeholder="Image URL"
value={data.image}
onChange={(e)=>setData("image",e.target.value)}
className="border p-2 rounded"
/>

<textarea
placeholder="Description"
value={data.description}
onChange={(e)=>setData("description",e.target.value)}
className="border p-2 rounded md:col-span-2"
/>

<button
type="submit"
disabled={processing}
className="bg-[#1B1F5E] text-white px-4 py-2 rounded md:col-span-2"
>
{editing ? "Update Reward" : "Create Reward"}
</button>

</form>

</div>

)}



{/* ================= DESKTOP TABLE ================= */}

<div className="hidden md:block bg-white rounded-2xl shadow">

<table className="w-full text-sm">

<thead className="bg-[#1B1F5E] text-white text-left">

<tr>

<th className="px-6 py-3">Image</th>
<th>Reward</th>
<th className="text-center">Points</th>
<th className="text-center">Stock</th>
<th className="text-center">Actions</th>

</tr>

</thead>

<tbody>

{renderDesktopRows("IN STOCK",inStock)}
{renderDesktopRows("OUT OF STOCK",outStock)}

</tbody>

</table>

</div>



{/* ================= MOBILE CARDS ================= */}

<div className="md:hidden space-y-6">

{renderMobileCards("In Stock",inStock)}
{renderMobileCards("Out of Stock",outStock)}

</div>


</AdminLayout>

</>

);

}