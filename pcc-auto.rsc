:local LAN_IF "ether6-OUT"

:put "PCC rebuild started"

/ip firewall mangle remove [find comment="PCC-AUTO"]
/ip route remove [find comment="PCC-AUTO"]

:local wans [/interface pppoe-client find where running=yes]
:local n [:len $wans]
:local idx 0

:put ("Running WANs = " . $n)

:foreach i in=$wans do={
  :local wan [/interface pppoe-client get $i name]
  :local rm ("to_" . $wan)
  :local cm ("cm_" . $wan)

  /ip route add dst-address=0.0.0.0/0 gateway=$wan routing-mark=$rm distance=1 comment="PCC-AUTO"

  /ip firewall mangle add chain=prerouting in-interface=$LAN_IF src-address-list=LAN_LOCAL dst-address-type=!local per-connection-classifier=("both-addresses-and-ports:" . $n . "/" . $idx) action=mark-connection new-connection-mark=$cm passthrough=yes comment="PCC-AUTO"
  /ip firewall mangle add chain=prerouting in-interface=$LAN_IF connection-mark=$cm action=mark-routing new-routing-mark=$rm passthrough=no comment="PCC-AUTO"

  :set idx ($idx + 1)
}

:put ("PCC rebuild done. Buckets=" . $idx)
