let slotCount = 1
function removeSlot(num) {
    let getSlot = document.getElementById(`Slot${num}`)
    getSlot.remove()
}
function addSlot() {
    const startLabel = document.createElement("label")
  startLabel.innerHTML = "Start"
  document.getElementById(`Slot${slotCount}`).appendChild(startLabel)


    var Slotstart = document.createElement("INPUT");
    Slotstart.setAttribute("type", "time");
    Slotstart.setAttribute("name", `slots[${slotCount}][start]`)
    document.getElementById(`Slot${slotCount}`).appendChild(Slotstart);

    const endLabel = document.createElement("label")
    endLabel.innerHTML = "end"
    document.getElementById(`Slot${slotCount}`).appendChild(endLabel)
  
    var Slotend = document.createElement("INPUT");
    Slotend.setAttribute("type", "time");
    Slotend.setAttribute("name", `slots[${slotCount}][end]`)
    document.getElementById(`Slot${slotCount}`).appendChild(Slotend);

    const Delete = document.createElement("button")
    Delete.innerHTML = "Delete Slot"
    Delete.setAttribute("onclick", `removeSlot(${slotCount})`)
    document.getElementById(`Slot${slotCount}`).appendChild(Delete)
  
    slotCount++;
  
  
    var newDiv = document.createElement("div")
    newDiv.setAttribute("id", `Slot${slotCount}`)
    document.getElementById("Slot").appendChild(newDiv)
  }