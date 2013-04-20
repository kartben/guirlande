--------------------------------------------------------------------------------
--  Copyright (c) 2013 Benjamin Cabé.
--  All rights reserved. This program and the accompanying materials
--  are made available under the terms of the Eclipse Public License v1.0
--  which accompanies this distribution, and is available at
--  http://www.eclipse.org/legal/epl-v10.html
--
--  Contributors:
--       Benjamin Cabé - initial API and implementation
--------------------------------------------------------------------------------

require 'sched'
require 'shell.telnet'
local lpd8806 = require 'lpd8806'
local asset_mgt = require 'racon'

-- Start a telnet server on port 1234
-- Once this program is started , you can start a Lua VM through telnet
-- using the following command: telnet localhost 1234
local function run_server()
	shell.telnet.init {
		address     = '0.0.0.0',
		port        = 1234,
		editmode    = "edit",
		historysize = 100 }
end

colors = {}
a = nil

local function color_listener()
	asset_mgt.init()
	local asset = asset_mgt.newAsset('leds')
	a = asset
	asset:start()
	asset.tree.pushPixel = function (self, record)
		if #colors == 64 then
			colors[64] = nil
		end
		table.insert(colors, 1, record[1])
		return 'ok'
	end

	asset.tree.writePixels = function (self, record)
		colors = record[1]
		return 'ok'
	end

	asset.tree.clear = function (self, record)
		lpd8806.clear(64)
		return 'ok'
	end

end

local function refresh_loop()
	local blinkOnOff = false
	while true do
		local colorBuffer= {}
		for i=1, 64 do
			if colors[i] then
				if ((not colors[i].blink) or (colors[i].blink and blinkOnOff)) then
					table.insert(colorBuffer, colors[i].green)
					table.insert(colorBuffer, colors[i].red)
					table.insert(colorBuffer, colors[i].blue)
				else
					table.insert(colorBuffer, 0)
					table.insert(colorBuffer, 0)
					table.insert(colorBuffer, 0)
				end
			else
				table.insert(colorBuffer, 0)
				table.insert(colorBuffer, 0)
				table.insert(colorBuffer, 0)
			end
		end
		-- print('refresh...')
		print(unpack(colorBuffer,1,15))
		lpd8806.writeColors(unpack(colorBuffer))
		blinkOnOff = not blinkOnOff
		os.execute('sleep 0.5')
		sched.wait()
	end
end

local function poll_m3da()
	sched.wait(1)
	while true do
		asset_mgt.connectToServer()
		sched.wait(1)
	end
end

local function main()
	-- Create a thread to start the telnet server
	sched.run(run_server)
	sched.run(color_listener)
	sched.run(refresh_loop)
	sched.run(poll_m3da)
	-- Starting the sched main loop to execute the previous task
	sched.loop()
end

main()

