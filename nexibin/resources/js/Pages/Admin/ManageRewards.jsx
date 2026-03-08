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
onSuccess:()=>{reset();setShowForm(false);}
});

}else{

post(route("admin.rewards.store"),{
onSuccess:()=>{reset();setShowForm(false);}
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

<div className="p-6">

<h1 className="text-xl font-bold mb-4">Manage Rewards</h1>

<button
onClick={()=>setShowForm(true)}
className="bg-yellow-400 px-4 py-2 rounded mb-4"
>
+ New Reward
</button>

{showForm && (

<form onSubmit={submit} className="space-y-3 mb-6">

<input
type="text"
placeholder="Reward name"
value={data.name}
onChange={(e)=>setData("name",e.target.value)}
className="border p-2 w-full"
/>

<textarea
placeholder="Description"
value={data.description}
onChange={(e)=>setData("description",e.target.value)}
className="border p-2 w-full"
/>

<input
type="number"
placeholder="Points Required"
value={data.points_required}
onChange={(e)=>setData("points_required",e.target.value)}
className="border p-2 w-full"
/>

<input
type="number"
placeholder="Stock"
value={data.stock}
onChange={(e)=>setData("stock",e.target.value)}
className="border p-2 w-full"
/>

<button className="bg-blue-600 text-white px-4 py-2 rounded">
Save Reward
</button>

</form>

)}

<table className="w-full border">

<thead className="bg-gray-200">
<tr>
<th>Name</th>
<th>Points</th>
<th>Stock</th>
<th>Action</th>
</tr>
</thead>

<tbody>

{rewards.map(r=>(
<tr key={r.id} className="border-t">

<td>{r.name}</td>
<td>{r.points_required}</td>
<td>{r.stock}</td>

<td className="space-x-2">

<button
onClick={()=>{setEditing(r);setShowForm(true);}}
className="text-yellow-600"
>
Edit
</button>

<button
onClick={()=>deleteReward(r.id)}
className="text-red-600"
>
Delete
</button>

</td>

</tr>
))}

</tbody>

</table>

</div>

</AdminLayout>

);

}