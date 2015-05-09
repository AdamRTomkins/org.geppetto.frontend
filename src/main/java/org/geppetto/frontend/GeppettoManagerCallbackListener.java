/*******************************************************************************
 * The MIT License (MIT)
 * 
 * Copyright (c) 2011 - 2015 OpenWorm.
 * http://openworm.org
 * 
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the MIT License
 * which accompanies this distribution, and is available at
 * http://opensource.org/licenses/MIT
 *
 * Contributors:
 *     	OpenWorm - http://openworm.org/people.html
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights 
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell 
 * copies of the Software, and to permit persons to whom the Software is 
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in 
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, 
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR 
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE 
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 *******************************************************************************/
package org.geppetto.frontend;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.geppetto.core.common.GeppettoErrorCodes;
import org.geppetto.core.simulation.IGeppettoManagerCallbackListener;
import org.geppetto.frontend.controllers.ConnectionHandler;
import org.geppetto.frontend.messages.OutboundMessages;

public class GeppettoManagerCallbackListener implements IGeppettoManagerCallbackListener
{

	private static Log logger = LogFactory.getLog(GeppettoManagerCallbackListener.class);

	private ConnectionHandler connectionHandler;

	public GeppettoManagerCallbackListener(ConnectionHandler connectionHandler)
	{
		this.connectionHandler=connectionHandler;
	}

	/**
	 * Receives update from simulation when there are new ones. From here the updates are send to the connected clients
	 * 
	 */
	@Override
	public void updateReady(GeppettoEvents event, String requestID, String sceneUpdate)
	{
		long start = System.currentTimeMillis();
		Date date = new Date(start);
		DateFormat formatter = new SimpleDateFormat("HH:mm:ss:SSS");
		String dateFormatted = formatter.format(date);
		logger.info("Simulation Frontend Update Starting: " + dateFormatted);

		OutboundMessages action = null;
		String update = "";

		// switch on message type
		switch(event)
		{
			case LOAD_PROJECT:
			{
				action = OutboundMessages.LOAD_PROJECT;


				sceneUpdate=sceneUpdate.substring(1, sceneUpdate.length()-1);
				// pack sceneUpdate and variableWatchTree in the same JSON string
				update = "{"+ sceneUpdate + "}";

				break;
			}
			case RUN_EXPERIMENT:
				action = OutboundMessages.EXPERIMENT_RUNNING;

				sceneUpdate=sceneUpdate.substring(1, sceneUpdate.length()-1);
				update = "{ "+sceneUpdate + "}";

				break;
			case SCENE_UPDATE:
			{	
				action = OutboundMessages.SCENE_UPDATE;

				sceneUpdate=sceneUpdate.substring(1, sceneUpdate.length()-1);
				update = "{ "+sceneUpdate + "}";

				break;
			}
			case QUEUE_EXPERIMENT:
				//action = OUTBOUND_MESSAGE_TYPES.;

				break;
			case REPLAY_EXPERIMENT:
				action = OutboundMessages.SIMULATION_OVER;
				break;
			default:
			{
			}
		}

		// Notify all connected clients about update either to load model or
		// update current one.
		connectionHandler.sendMessage(requestID, action, update);

		logger.info("Simulation Frontend Update Finished: Took:" + (System.currentTimeMillis() - start));
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.geppetto.core.simulation.ISimulationCallbackListener#error(org.geppetto.core.common.GeppettoErrorCodes, java.lang.String, java.lang.String)
	 */
	@Override
	public void error(GeppettoErrorCodes errorCode, String classSource, String errorMessage, Exception e)
	{
		String jsonExceptionMsg=e==null?"":e.toString();
		String jsonErrorMsg=errorMessage==null?"":errorMessage;
		String error = "{ \"error_code\": \"" + errorCode.toString() + "\", \"source\": \"" + classSource + "\", \"message\": \"" + jsonErrorMsg + "\", \"exception\": \"" + jsonExceptionMsg +"\"}";
		logger.error(errorMessage,e);
		// Notify all connected clients about update either to load model or update current one.
		connectionHandler.sendMessage(null, OutboundMessages.ERROR, error);
	}


	public void message(String message)
	{
		String info = "{ \"content\": \"" + message +"\"}";
		logger.info(message);
		// Notify all connected clients about update either to load model or update current one.
		connectionHandler.sendMessage(null, OutboundMessages.INFO_MESSAGE, info);
	}

}
