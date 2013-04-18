---
-- @module lpd8806
local M = {}

local bit32 = require 'bit32'

---
-- @function [parent=#lpd8806] writeColors
-- @param ... b,g,r,b,g,r,b,g,r,...
local function writeColors(...)
	local f = io.open("/dev/spidev0.0", "wb")
	local gamma = {}
	for i = 1, 256 do gamma[i] = bit32.bor(128, math.floor(math.pow(((i-1) / 255.0), 2.5) * 127.0 + 0.5)) end

	for i, v in ipairs{...} do
		f:write(string.char(gamma[v+1]))
	end

	f:write(string.char(0))
	f:write(string.char(0))
	f:write(string.char(0))

	f:flush()
	f:close()
end

---
-- @function [parent=#lpd8806] writeFlags
-- @param threshold threshold
-- @param ... values
local function writeFlags(threshold, ...)
	local colors = {}
	for i, v in ipairs{...} do
		colors[(i-1) * 3 +1] = math.floor(255 * v / threshold)
		if v == 0 then
			colors[(i-1) * 3 +2] = 0
		else
			colors[(i-1) * 3 +2] = math.floor(150 * (threshold-v) / threshold)
		end
		colors[(i-1) * 3 +3] = 0
	end
	writeColors(unpack(colors))
	--print(unpack(colors))
end

---
-- @function [parent=#lpd8806] clear
-- @param #number nb number of pixels to clear
local function clear(nb)
	local nb = nb or 64
	local colors ={}
	for i = 1, nb*3 do
		colors[i] = 0
	end
	writeColors(unpack(colors))
end

M.writeColors = writeColors
M.writeFlags = writeFlags
M.clear = clear

return M