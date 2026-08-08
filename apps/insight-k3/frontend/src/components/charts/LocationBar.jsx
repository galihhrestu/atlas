import {
BarChart,
Bar,
XAxis,
YAxis,
Tooltip,
ResponsiveContainer
} from "recharts";


const data=[

{
name:"Harvesting",
value:7
},

{
name:"Workshop",
value:5
},

{
name:"Transport",
value:4
},

{
name:"Nursery",
value:3
},

{
name:"Office",
value:2
}

];



function LocationBar(){


return(

<ResponsiveContainer width="100%" height={320}>


<BarChart data={data}>


<XAxis dataKey="name"/>

<YAxis/>


<Tooltip/>


<Bar
dataKey="value"
fill="#1E88E5"
/>


</BarChart>


</ResponsiveContainer>


)


}


export default LocationBar;