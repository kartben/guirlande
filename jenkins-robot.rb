###############################################################################
# Copyright (c) 2013 Benjamin Cabé and others.
# All rights reserved. This program and the accompanying materials
# are made available under the terms of the Eclipse Public License v1.0
# which accompanies this distribution, and is available at
# http://www.eclipse.org/legal/epl-v10.html
#
# Contributors:
#     Benjamin Cabé - initial API and implementation
###############################################################################

require 'awesome_print'
require 'net/http'
require 'net/https'
require 'openssl'
require 'uri'
require 'json'

uri = URI.parse("https://jenkins/platform-new/api/json?pretty=true")
http = Net::HTTP.new(uri.host, uri.port)
http.use_ssl = true
http.verify_mode = OpenSSL::SSL::VERIFY_NONE # read into this
@data = http.get(uri.request_uri)

result = JSON.parse(@data.body)

#ap result

http = Net::HTTP.new("m2m.eclipse.org")

colors = {}

colors['grey'] = { :red => 100, :green => 100, :blue => 100}
colors['aborted'] = { :red => 100, :green => 100, :blue => 100}
colors['yellow'] = { :red => 255, :green => 255, :blue => 0}
colors['blue'] = { :red => 0, :green => 0, :blue => 255}
colors['red'] = { :red => 255, :green => 0, :blue => 0}

colors['aborted_anime'] = { :red => 100, :green => 100, :blue => 100, :blink => true}
colors['yellow_anime'] = { :red => 255, :green => 255, :blue => 0, :blink => true}
colors['blue_anime'] = { :red => 0, :green => 0, :blue => 255, :blink => true}
colors['red_anime'] = { :red => 255, :green => 0, :blue => 0, :blink => true}

values = []
result['jobs'].each do |j|
#	ap j['color']
	values << colors[j['color']]
end

settings = { :settings => [ { :key => "leds.writePixels", :value => values } ] }
#ap settings.to_json

request = Net::HTTP::Post.new("/m3da/data/jaxcon-demo")
request.body = settings.to_json
response = http.request(request)
